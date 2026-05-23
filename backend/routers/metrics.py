"""
Metrics endpoints — trigger computation, fetch daily metrics, get snapshot.
"""

import os
from uuid import UUID
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from database import get_db
from models import Portfolio, DailyMetric, PortfolioSnapshot
from schemas import (
    ComputeResult,
    MetricsResponse,
    DailyMetricRow,
    PortfolioDailyRow,
    SnapshotResponse,
    PerAssetStats,
)
from services.portfolio_service import compute_and_store
from services.auth import get_current_user

router = APIRouter(tags=["metrics"])

RANGE_MAP = {"1M": 30, "3M": 90, "6M": 180, "1Y": 365}


@router.post("/portfolios/{portfolio_id}/compute", response_model=ComputeResult)
async def compute_metrics(
    portfolio_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Trigger full metric computation for a portfolio."""

    # Check portfolio exists and belongs to the user
    result = await db.execute(
        select(Portfolio).where(and_(Portfolio.id == portfolio_id, Portfolio.user_id == user_id))
    )
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if portfolio.status == "computing":
        raise HTTPException(
            status_code=409,
            detail={"detail": "Computation already in progress", "code": "COMPUTE_IN_PROGRESS"},
        )

    risk_free_rate = float(os.getenv("RISK_FREE_RATE", "0.065"))
    period = os.getenv("YFINANCE_PERIOD", "2y")

    try:
        result = await compute_and_store(
            portfolio_id=portfolio_id,
            db=db,
            risk_free_rate=risk_free_rate,
            period=period,
        )
        return ComputeResult(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"detail": str(e), "code": "COMPUTATION_ERROR"},
        )


@router.get("/portfolios/{portfolio_id}/metrics", response_model=MetricsResponse)
async def get_metrics(
    portfolio_id: UUID,
    range: str = Query(default="6M", pattern="^(1M|3M|6M|1Y|ALL)$"),
    ticker: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get daily metrics for all assets in a portfolio, filtered by date range."""
    import pandas as pd

    # Check portfolio exists and belongs to user
    result = await db.execute(
        select(Portfolio).where(and_(Portfolio.id == portfolio_id, Portfolio.user_id == user_id))
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Calculate date cutoff
    if range == "ALL":
        cutoff = date(1970, 1, 1)
    else:
        days = RANGE_MAP.get(range, 180)
        cutoff = date.today() - timedelta(days=days)

    # Query daily metrics
    query = (
        select(DailyMetric)
        .where(
            DailyMetric.portfolio_id == portfolio_id,
            DailyMetric.date >= cutoff,
        )
    )
    if ticker:
        query = query.where(DailyMetric.ticker == ticker)

    query = query.order_by(DailyMetric.ticker, DailyMetric.date)
    result = await db.execute(query)
    metrics = result.scalars().all()

    # Group by ticker and recalculate cumulative & drawdown dynamically
    assets_dict: dict[str, list[DailyMetricRow]] = {}
    
    raw_assets = {}
    for m in metrics:
        if m.ticker not in raw_assets:
            raw_assets[m.ticker] = []
        raw_assets[m.ticker].append(m)

    for ticker_name, m_list in raw_assets.items():
        m_list.sort(key=lambda x: x.date)
        returns = pd.Series([float(m.daily_return) if m.daily_return is not None else 0.0 for m in m_list])
        
        # Dynamic calculation
        cumulative = (1 + returns).cumprod()
        rolling_max = cumulative.cummax()
        drawdowns = (cumulative / rolling_max) - 1
        cum_returns = cumulative - 1
        
        assets_dict[ticker_name] = []
        for i, m in enumerate(m_list):
            assets_dict[ticker_name].append(
                DailyMetricRow(
                    date=m.date,
                    price=float(m.price) if m.price is not None else None,
                    daily_return=float(m.daily_return) if m.daily_return is not None else None,
                    rolling_vol_30d=float(m.rolling_vol_30d) if m.rolling_vol_30d is not None else None,
                    drawdown=round(float(drawdowns.iloc[i]), 6),
                    cumulative_return=round(float(cum_returns.iloc[i]), 6),
                )
            )

    # Query portfolio-level snapshots
    snap_result = await db.execute(
        select(PortfolioSnapshot)
        .where(
            PortfolioSnapshot.portfolio_id == portfolio_id,
            PortfolioSnapshot.date >= cutoff,
        )
        .order_by(PortfolioSnapshot.date)
    )
    snapshots = snap_result.scalars().all()

    portfolio_daily = []
    if snapshots:
        snapshots.sort(key=lambda x: x.date)
        port_returns = pd.Series([float(s.portfolio_return) if s.portfolio_return is not None else 0.0 for s in snapshots])
        bench_returns = pd.Series([float(s.benchmark_return) if s.benchmark_return is not None else 0.0 for s in snapshots])
        
        # Dynamic calculation
        port_cum = (1 + port_returns).cumprod()
        port_max = port_cum.cummax()
        port_dd = (port_cum / port_max) - 1
        port_cum_ret = port_cum - 1
        
        bench_cum = (1 + bench_returns).cumprod()
        bench_cum_ret = bench_cum - 1

        for i, s in enumerate(snapshots):
            rel_alpha = float(port_cum_ret.iloc[i]) - float(bench_cum_ret.iloc[i])
            portfolio_daily.append(
                PortfolioDailyRow(
                    date=s.date,
                    portfolio_return=float(s.portfolio_return) if s.portfolio_return is not None else None,
                    rolling_vol_30d=float(s.rolling_vol_30d) if s.rolling_vol_30d is not None else None,
                    drawdown=round(float(port_dd.iloc[i]), 6),
                    cumulative_return=round(float(port_cum_ret.iloc[i]), 6),
                    benchmark_return=float(s.benchmark_return) if s.benchmark_return is not None else None,
                    benchmark_cumulative_return=round(float(bench_cum_ret.iloc[i]), 6),
                    relative_alpha=round(rel_alpha, 6),
                    tracking_difference=round(rel_alpha, 6),
                )
            )

    return MetricsResponse(
        portfolio_id=portfolio_id,
        range=range,
        assets=assets_dict,
        portfolio=portfolio_daily,
    )


@router.get("/portfolios/{portfolio_id}/snapshot", response_model=SnapshotResponse)
async def get_snapshot(
    portfolio_id: UUID,
    range: str = Query(default="6M", pattern="^(1M|3M|6M|1Y|ALL)$"),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    import pandas as pd
    import numpy as np
    
    # Check portfolio exists and belongs to user
    port_result = await db.execute(
        select(Portfolio).where(and_(Portfolio.id == portfolio_id, Portfolio.user_id == user_id))
    )
    portfolio = port_result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # Get latest snapshot for `computed_at` date
    latest_result = await db.execute(
        select(PortfolioSnapshot.computed_at, PortfolioSnapshot.date)
        .where(PortfolioSnapshot.portfolio_id == portfolio_id)
        .order_by(PortfolioSnapshot.date.desc())
        .limit(1)
    )
    latest_meta = latest_result.first()
    if not latest_meta:
        return SnapshotResponse(
            portfolio_id=portfolio_id,
            date=None,
            annualized_return=None,
            portfolio_volatility=None,
            max_drawdown=None,
            sharpe_ratio=None,
            correlation_matrix=None,
            per_asset=None,
            computed_at=None,
        )

    # Calculate cutoff
    if range == "ALL":
        cutoff = date(1970, 1, 1)
    else:
        days = RANGE_MAP.get(range, 180)
        cutoff = date.today() - timedelta(days=days)

    # Get portfolio daily returns
    snap_result = await db.execute(
        select(PortfolioSnapshot)
        .where(
            PortfolioSnapshot.portfolio_id == portfolio_id,
            PortfolioSnapshot.date >= cutoff
        )
        .order_by(PortfolioSnapshot.date)
    )
    snapshots = snap_result.scalars().all()
    
    if not snapshots:
        raise HTTPException(status_code=404, detail="No snapshot data available for the period")

    port_returns = pd.Series([float(s.portfolio_return) if s.portfolio_return is not None else 0.0 for s in snapshots])
    n_years = max(len(port_returns) / 252, 0.001)
    
    port_cum = (1 + port_returns).cumprod()
    port_max = port_cum.cummax()
    port_dd = (port_cum / port_max) - 1
    
    tot_return = (1 + port_returns).prod() - 1
    ann_return = (1 + tot_return) ** (1 / n_years) - 1
    port_vol = port_returns.std() * np.sqrt(252)
    max_dd = port_dd.min()
    
    risk_free = float(os.getenv("RISK_FREE_RATE", "0.065"))
    sharpe = (ann_return - risk_free) / port_vol if port_vol > 0 else 0.0

    # Get per-asset daily returns for correlation and stats
    daily_result = await db.execute(
        select(DailyMetric)
        .where(
            DailyMetric.portfolio_id == portfolio_id,
            DailyMetric.date >= cutoff
        )
        .order_by(DailyMetric.date)
    )
    daily_metrics = daily_result.scalars().all()
    
    df_list = []
    for m in daily_metrics:
        df_list.append({
            "date": m.date,
            "ticker": m.ticker,
            "daily_return": float(m.daily_return) if m.daily_return is not None else 0.0
        })
    
    per_asset_stats = {}
    corr_dict = {}
    
    if df_list:
        df = pd.DataFrame(df_list)
        returns_df = df.pivot(index="date", columns="ticker", values="daily_return").fillna(0)
        correlation_matrix = returns_df.corr()
        
        for t1 in returns_df.columns:
            corr_dict[t1] = {}
            for t2 in returns_df.columns:
                corr_dict[t1][t2] = round(float(correlation_matrix.loc[t1, t2]), 4)
                
            asset_ret = returns_df[t1]
            a_cum = (1 + asset_ret).cumprod()
            a_max = a_cum.cummax()
            a_dd = (a_cum / a_max) - 1
            a_tot = (1 + asset_ret).prod() - 1
            a_ann = (1 + a_tot) ** (1 / n_years) - 1
            a_vol = asset_ret.std() * np.sqrt(252)
            a_sharpe = (a_ann - risk_free) / a_vol if a_vol > 0 else 0.0
            
            per_asset_stats[t1] = PerAssetStats(
                annualized_return=round(float(a_ann), 6),
                volatility=round(float(a_vol), 6),
                sharpe=round(float(a_sharpe), 4),
                max_drawdown=round(float(a_dd.min()), 6)
            )

    return SnapshotResponse(
        portfolio_id=portfolio_id,
        date=latest_meta.date,
        annualized_return=round(float(ann_return), 6),
        portfolio_volatility=round(float(port_vol), 6),
        max_drawdown=round(float(max_dd), 6),
        sharpe_ratio=round(float(sharpe), 4),
        correlation_matrix=corr_dict,
        per_asset=per_asset_stats if per_asset_stats else None,
        computed_at=latest_meta.computed_at,
    )
