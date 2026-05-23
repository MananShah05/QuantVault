"""
Allocation service — computes total exposure, average correlation, sector concentration, and diversification score.
"""

import logging
import yfinance as yf
from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import numpy as np

from models import Portfolio, PortfolioAsset, PortfolioSnapshot

logger = logging.getLogger(__name__)

async def get_allocation_summary(portfolio_id: UUID, db: AsyncSession, user_id: str = None) -> dict:
    """
    Retrieve and calculate the allocation metrics for the portfolio.
    If sector data is missing for assets, fetch and write back to DB dynamically.
    """
    # 1. Load portfolio + assets, scoped by user_id if provided
    query = select(Portfolio).options(selectinload(Portfolio.assets)).where(Portfolio.id == portfolio_id)
    if user_id:
        from sqlalchemy import and_
        query = query.where(Portfolio.user_id == user_id)
        
    result = await db.execute(query)
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    # 2. Get latest snapshot for correlation matrix
    snap_result = await db.execute(
        select(PortfolioSnapshot)
        .where(PortfolioSnapshot.portfolio_id == portfolio_id)
        .order_by(PortfolioSnapshot.date.desc())
        .limit(1)
    )
    snapshot = snap_result.scalar_one_or_none()

    # 3. Calculate total exposure
    total_exposure = sum(float(a.weight) for a in portfolio.assets)

    # 4. Resolve sectors (dynamically update DB if missing)
    sectors_dict = {}
    db_updated = False
    
    for asset in portfolio.assets:
        sec = asset.sector
        if not sec:
            try:
                logger.info(f"Sector missing for {asset.ticker}. Fetching from yfinance...")
                t = yf.Ticker(asset.ticker)
                info = t.info
                sec = info.get("sector")
                
                # Fallback if sector is not provided by yfinance (e.g. for ETFs, Gold, Crypto)
                if not sec:
                    quote_type = info.get("quoteType", "EQUITY")
                    if quote_type == "ETF":
                        sec = "Diversified ETF"
                    elif quote_type == "CURRENCY" or asset.asset_class == "fx":
                        sec = "Foreign Exchange"
                    elif quote_type == "CRYPTOCURRENCY" or asset.asset_class == "crypto":
                        sec = "Digital Asset"
                    elif quote_type == "FUTURE" or asset.asset_class == "commodity":
                        sec = "Commodities"
                    else:
                        sec = "Alternative/Other"
                
                # Write back to asset
                asset.sector = sec
                db_updated = True
            except Exception as e:
                logger.error(f"Failed to fetch sector for {asset.ticker}: {e}")
                sec = "Alternative/Other"
                asset.sector = sec
                db_updated = True
                
        sectors_dict[asset.ticker] = sec

    if db_updated:
        await db.commit()

    # 5. Group weights by sector
    sector_weights = {}
    for asset in portfolio.assets:
        sec = sectors_dict.get(asset.ticker, "Alternative/Other")
        w = float(asset.weight)
        sector_weights[sec] = sector_weights.get(sec, 0.0) + w

    sector_concentration = [
        {"sector": sec, "weight": round(w, 4)}
        for sec, w in sorted(sector_weights.items(), key=lambda x: x[1], reverse=True)
    ]

    top_sector = sector_concentration[0]["sector"] if sector_concentration else "Unknown"

    # 6. Compute Average Intra-Portfolio Correlation
    avg_corr = 0.0
    if snapshot and snapshot.correlation_matrix:
        corr_matrix = snapshot.correlation_matrix
        off_diagonals = []
        tickers = list(corr_matrix.keys())
        for i in range(len(tickers)):
            for j in range(i + 1, len(tickers)):
                t1, t2 = tickers[i], tickers[j]
                val = corr_matrix.get(t1, {}).get(t2)
                if val is not None:
                    off_diagonals.append(float(val))
        if off_diagonals:
            avg_corr = float(np.mean(off_diagonals))

    # 7. Diversification Score (0-100)
    # Sector HHI (Herfindahl-Hirschman Index) ranges from 1/N to 1.0. Lower HHI = more diversified.
    hhi = sum((item["weight"] / total_exposure) ** 2 for item in sector_concentration) if total_exposure > 0 else 1.0
    sector_score = (1.0 - hhi) * 100 # Perfect sector diversification -> 100
    
    # Correlation Score: average correlation ranges between -1 and 1. Lower correlation = better.
    # Standardize so avg_corr = 0 maps to 80, avg_corr = 1 maps to 0, and avg_corr = -1 maps to 100.
    corr_score = max(0.0, min(100.0, (1.0 - avg_corr) * 50.0))
    
    # Mix: 50% sector weight distribution, 50% correlation profile
    diversification_score = 0.5 * sector_score + 0.5 * corr_score
    
    # Floor to reasonable boundary
    diversification_score = round(max(10.0, min(99.0, diversification_score)), 1)

    return {
        "portfolio_id": portfolio_id,
        "total_exposure": round(total_exposure, 4),
        "intra_portfolio_correlation": round(avg_corr, 4),
        "sector_concentration": sector_concentration,
        "diversification_score": diversification_score,
        "top_sector": top_sector,
        "as_of_date": date.today().isoformat()
    }
