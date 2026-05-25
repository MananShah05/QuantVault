"""
Portfolio service — orchestrates data fetch, metric computation, and DB storage.
"""

import time
import logging
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert

from models import Portfolio, PortfolioAsset, DailyMetric, PortfolioSnapshot
from services import market_data, metrics_engine
from services.benchmark_service import compute_benchmark_metrics, determine_benchmark

logger = logging.getLogger(__name__)


async def compute_and_store(
    portfolio_id: UUID,
    db: AsyncSession,
    risk_free_rate: float = 0.065,
    period: str = "2y",
) -> dict:
    """
    Full computation pipeline: fetch prices → compute metrics → store in DB.

    Args:
        portfolio_id: UUID of the portfolio to compute
        db: Async database session
        risk_free_rate: Annualized risk-free rate
        period: yfinance period string (e.g. "2y")

    Returns:
        Dict with computation summary (status, rows_written, etc.)
    """
    start_time = time.time()

    # 1. Load portfolio + assets
    result = await db.execute(
        select(Portfolio)
        .options(selectinload(Portfolio.assets))
        .where(Portfolio.id == portfolio_id)
    )
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        raise ValueError(f"Portfolio {portfolio_id} not found")

    # 2. Set status to computing
    portfolio.status = "computing"
    await db.commit()

    try:
        # 3. Extract tickers and weights
        tickers = [a.ticker for a in portfolio.assets]
        weights = {a.ticker: float(a.weight) for a in portfolio.assets}

        logger.info(f"Computing metrics for portfolio '{portfolio.name}': {tickers}")

        # 4. Fetch price data
        prices = await market_data.fetch_prices(tickers, period=period)

        # 5. Compute all metrics
        result_data = metrics_engine.compute(prices, weights, risk_free_rate)

        daily_df = result_data["daily"]
        portfolio_daily_df = result_data["portfolio_daily"]
        snapshot = result_data["snapshot"]

        if not portfolio_daily_df.empty:
            benchmark_ticker = determine_benchmark(tickers)
            portfolio_daily_df = await compute_benchmark_metrics(
                portfolio_daily=portfolio_daily_df,
                benchmark_ticker=benchmark_ticker,
                start_date=portfolio_daily_df["date"].min(),
                end_date=portfolio_daily_df["date"].max(),
            )

        # 6. Bulk upsert daily_metrics
        daily_rows = []
        for _, row in daily_df.iterrows():
            daily_rows.append({
                "portfolio_id": portfolio_id,
                "ticker": row["ticker"],
                "date": row["date"],
                "price": row["price"],
                "daily_return": row["daily_return"],
                "rolling_vol_30d": row["rolling_vol_30d"],
                "rolling_vol_60d": row["rolling_vol_60d"],
                "drawdown": row["drawdown"],
                "cumulative_return": row["cumulative_return"],
            })

        chunk_size = 500

        if daily_rows:
            # Batch upsert in chunks to avoid oversized queries
            for i in range(0, len(daily_rows), chunk_size):
                chunk = daily_rows[i : i + chunk_size]
                stmt = insert(DailyMetric).values(chunk)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["portfolio_id", "ticker", "date"],
                    set_={
                        "price": stmt.excluded.price,
                        "daily_return": stmt.excluded.daily_return,
                        "rolling_vol_30d": stmt.excluded.rolling_vol_30d,
                        "rolling_vol_60d": stmt.excluded.rolling_vol_60d,
                        "drawdown": stmt.excluded.drawdown,
                        "cumulative_return": stmt.excluded.cumulative_return,
                        "computed_at": datetime.now(timezone.utc),
                    },
                )
                await db.execute(stmt)

        # 7. Bulk upsert portfolio_snapshots
        snapshot_rows = []
        for _, row in portfolio_daily_df.iterrows():
            snapshot_row = {
                "portfolio_id": portfolio_id,
                "date": row["date"],
                "portfolio_return": row["portfolio_return"],
                "rolling_vol_30d": row["rolling_vol_30d"],
                "drawdown": row["drawdown"],
                "cumulative_return": row["cumulative_return"],
                "benchmark_return": row.get("benchmark_return"),
                "benchmark_cumulative_return": row.get("benchmark_cumulative_return"),
                "annualized_return": None,
                "portfolio_volatility": None,
                "max_drawdown": None,
                "sharpe_ratio": None,
                "correlation_matrix": None,
            }
            snapshot_rows.append(snapshot_row)

        # Populate the latest row with scalar aggregates
        if snapshot_rows:
            snapshot_rows[-1]["annualized_return"] = snapshot["annualized_return"]
            snapshot_rows[-1]["portfolio_volatility"] = snapshot["portfolio_volatility"]
            snapshot_rows[-1]["max_drawdown"] = snapshot["max_drawdown"]
            snapshot_rows[-1]["sharpe_ratio"] = snapshot["sharpe_ratio"]
            snapshot_rows[-1]["correlation_matrix"] = snapshot["correlation_matrix"]

            # Batch upsert snapshots
            for i in range(0, len(snapshot_rows), chunk_size):
                chunk = snapshot_rows[i : i + chunk_size]
                stmt = insert(PortfolioSnapshot).values(chunk)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["portfolio_id", "date"],
                    set_={
                        "portfolio_return": stmt.excluded.portfolio_return,
                        "rolling_vol_30d": stmt.excluded.rolling_vol_30d,
                        "drawdown": stmt.excluded.drawdown,
                        "cumulative_return": stmt.excluded.cumulative_return,
                        "benchmark_return": stmt.excluded.benchmark_return,
                        "benchmark_cumulative_return": stmt.excluded.benchmark_cumulative_return,
                        "annualized_return": stmt.excluded.annualized_return,
                        "portfolio_volatility": stmt.excluded.portfolio_volatility,
                        "max_drawdown": stmt.excluded.max_drawdown,
                        "sharpe_ratio": stmt.excluded.sharpe_ratio,
                        "correlation_matrix": stmt.excluded.correlation_matrix,
                        "computed_at": datetime.now(timezone.utc),
                    },
                )
                await db.execute(stmt)

        # 8. Update portfolio status
        portfolio.status = "ready"
        portfolio.last_computed = datetime.now(timezone.utc)
        await db.commit()

        duration = round(time.time() - start_time, 2)
        total_rows = len(daily_rows) + len(snapshot_rows)

        # Determine date range
        dates = daily_df["date"].tolist()
        date_range = {
            "from": str(min(dates)) if dates else None,
            "to": str(max(dates)) if dates else None,
        }

        logger.info(
            f"Computation complete for '{portfolio.name}': "
            f"{total_rows} rows written in {duration}s"
        )

        return {
            "status": "completed",
            "assets_processed": len(tickers),
            "date_range": date_range,
            "rows_written": total_rows,
            "duration_seconds": duration,
        }

    except Exception as e:
        # On failure, set status to error
        portfolio.status = "error"
        await db.commit()
        logger.error(f"Computation failed for portfolio {portfolio_id}: {e}")
        raise
