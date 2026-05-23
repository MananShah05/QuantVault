"""
Core analytics engine — computes all risk metrics from price data.

All computations use pandas/numpy on daily price DataFrames.
Formulas follow standard quantitative finance conventions.
"""

import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


def compute(
    prices: pd.DataFrame,
    weights: dict[str, float],
    risk_free_rate: float = 0.065,
) -> dict:
    """
    Compute full risk analytics for a portfolio.

    Args:
        prices: DataFrame with DatetimeIndex, columns = ticker symbols, values = adjusted close
        weights: Dict mapping ticker → decimal weight (must sum to ~1.0)
        risk_free_rate: Annualized risk-free rate (default 6.5% India T-bill)

    Returns:
        Dict with keys:
            - "daily": DataFrame of per-asset daily metrics
            - "portfolio_daily": DataFrame of portfolio-level daily metrics
            - "snapshot": Dict of scalar aggregates + correlation matrix
    """
    tickers = list(weights.keys())
    prices = prices[tickers].copy()

    # ── Daily returns ──
    returns = prices.pct_change().dropna()

    # ── Rolling 30-day annualized volatility ──
    rolling_vol_30d = returns.rolling(30).std() * np.sqrt(252)

    # ── Rolling 60-day annualized volatility ──
    rolling_vol_60d = returns.rolling(60).std() * np.sqrt(252)

    # ── Drawdown per asset ──
    cumulative = (1 + returns).cumprod()
    rolling_max = cumulative.cummax()
    drawdown = (cumulative / rolling_max) - 1

    # ── Cumulative return ──
    cumulative_return = cumulative - 1

    # ── Build per-asset daily DataFrame ──
    # We'll create a long-format DataFrame for easy DB storage
    daily_records = []
    for ticker in tickers:
        for dt in returns.index:
            daily_records.append({
                "ticker": ticker,
                "date": dt.date() if hasattr(dt, "date") else dt,
                "price": float(prices.loc[dt, ticker]) if not pd.isna(prices.loc[dt, ticker]) else None,
                "daily_return": _safe_float(returns.loc[dt, ticker]),
                "rolling_vol_30d": _safe_float(rolling_vol_30d.loc[dt, ticker]),
                "rolling_vol_60d": _safe_float(rolling_vol_60d.loc[dt, ticker]),
                "drawdown": _safe_float(drawdown.loc[dt, ticker]),
                "cumulative_return": _safe_float(cumulative_return.loc[dt, ticker]),
            })

    daily_df = pd.DataFrame(daily_records)

    # ── Portfolio-level metrics ──
    weight_series = pd.Series(weights)
    portfolio_returns = returns[tickers].dot(weight_series)

    portfolio_cumulative = (1 + portfolio_returns).cumprod()
    portfolio_rolling_max = portfolio_cumulative.cummax()
    portfolio_drawdown = (portfolio_cumulative / portfolio_rolling_max) - 1
    portfolio_cumulative_return = portfolio_cumulative - 1
    portfolio_rolling_vol_30d = portfolio_returns.rolling(30).std() * np.sqrt(252)

    portfolio_daily_records = []
    for dt in portfolio_returns.index:
        portfolio_daily_records.append({
            "date": dt.date() if hasattr(dt, "date") else dt,
            "portfolio_return": _safe_float(portfolio_returns.loc[dt]),
            "rolling_vol_30d": _safe_float(portfolio_rolling_vol_30d.loc[dt]),
            "drawdown": _safe_float(portfolio_drawdown.loc[dt]),
            "cumulative_return": _safe_float(portfolio_cumulative_return.loc[dt]),
        })

    portfolio_daily_df = pd.DataFrame(portfolio_daily_records)

    # ── Scalar aggregates (snapshot) ──
    n_years = len(returns) / 252

    # Per-asset annualized return
    per_asset_total_return = (1 + returns).prod() - 1
    per_asset_annualized_return = (1 + per_asset_total_return) ** (1 / n_years) - 1

    # Per-asset annualized volatility
    per_asset_annualized_vol = returns.std() * np.sqrt(252)

    # Per-asset Sharpe ratio
    per_asset_sharpe = (per_asset_annualized_return - risk_free_rate) / per_asset_annualized_vol

    # Per-asset max drawdown
    per_asset_max_drawdown = drawdown.min()

    # Portfolio-level scalars
    portfolio_total_return = (1 + portfolio_returns).prod() - 1
    portfolio_annualized_return = (1 + portfolio_total_return) ** (1 / n_years) - 1
    portfolio_annualized_vol = portfolio_returns.std() * np.sqrt(252)
    portfolio_sharpe = (portfolio_annualized_return - risk_free_rate) / portfolio_annualized_vol
    portfolio_max_drawdown = portfolio_drawdown.min()

    # Correlation matrix
    correlation_matrix = returns.corr()
    corr_dict = {}
    for t1 in tickers:
        corr_dict[t1] = {}
        for t2 in tickers:
            corr_dict[t1][t2] = round(float(correlation_matrix.loc[t1, t2]), 4)

    # Per-asset stats dict
    per_asset_stats = {}
    for ticker in tickers:
        per_asset_stats[ticker] = {
            "annualized_return": _safe_float(per_asset_annualized_return[ticker]),
            "volatility": _safe_float(per_asset_annualized_vol[ticker]),
            "sharpe": _safe_float(per_asset_sharpe[ticker]),
            "max_drawdown": _safe_float(per_asset_max_drawdown[ticker]),
        }

    snapshot = {
        "annualized_return": _safe_float(portfolio_annualized_return),
        "portfolio_volatility": _safe_float(portfolio_annualized_vol),
        "max_drawdown": _safe_float(portfolio_max_drawdown),
        "sharpe_ratio": _safe_float(portfolio_sharpe),
        "correlation_matrix": corr_dict,
        "per_asset": per_asset_stats,
    }

    logger.info(
        f"Computed metrics: {len(daily_df)} daily rows, "
        f"{len(portfolio_daily_df)} portfolio rows, "
        f"annualized_return={snapshot['annualized_return']:.4f}"
    )

    return {
        "daily": daily_df,
        "portfolio_daily": portfolio_daily_df,
        "snapshot": snapshot,
    }


def _safe_float(val) -> float | None:
    """Convert numpy/pandas numeric to Python float, handling NaN."""
    if val is None:
        return None
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return None
        return round(f, 6)
    except (TypeError, ValueError):
        return None
