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
    # Using pandas melt for vectorization (much faster than nested loops)
    prices_melted = prices.reset_index().melt(id_vars="index", var_name="ticker", value_name="price")
    returns_melted = returns.reset_index().melt(id_vars="index", var_name="ticker", value_name="daily_return")
    vol30_melted = rolling_vol_30d.reset_index().melt(id_vars="index", var_name="ticker", value_name="rolling_vol_30d")
    vol60_melted = rolling_vol_60d.reset_index().melt(id_vars="index", var_name="ticker", value_name="rolling_vol_60d")
    drawdown_melted = drawdown.reset_index().melt(id_vars="index", var_name="ticker", value_name="drawdown")
    cumret_melted = cumulative_return.reset_index().melt(id_vars="index", var_name="ticker", value_name="cumulative_return")

    daily_df = prices_melted.merge(returns_melted, on=["index", "ticker"], how="inner")
    daily_df = daily_df.merge(vol30_melted, on=["index", "ticker"], how="left")
    daily_df = daily_df.merge(vol60_melted, on=["index", "ticker"], how="left")
    daily_df = daily_df.merge(drawdown_melted, on=["index", "ticker"], how="left")
    daily_df = daily_df.merge(cumret_melted, on=["index", "ticker"], how="left")

    daily_df.rename(columns={"index": "date"}, inplace=True)
    daily_df["date"] = daily_df["date"].apply(lambda dt: dt.date() if hasattr(dt, "date") else dt)

    # Clean up types for DB storage
    for col in ["daily_return", "rolling_vol_30d", "rolling_vol_60d", "drawdown", "cumulative_return"]:
        daily_df[col] = daily_df[col].apply(_safe_float)

    # ── Portfolio-level metrics ──
    weight_series = pd.Series(weights)
    portfolio_returns = returns[tickers].dot(weight_series)

    portfolio_cumulative = (1 + portfolio_returns).cumprod()
    portfolio_rolling_max = portfolio_cumulative.cummax()
    portfolio_drawdown = (portfolio_cumulative / portfolio_rolling_max) - 1
    portfolio_cumulative_return = portfolio_cumulative - 1
    portfolio_rolling_vol_30d = portfolio_returns.rolling(30).std() * np.sqrt(252)

    portfolio_daily_df = pd.DataFrame({
        "date": portfolio_returns.index,
        "portfolio_return": portfolio_returns.values,
        "rolling_vol_30d": portfolio_rolling_vol_30d.values,
        "drawdown": portfolio_drawdown.values,
        "cumulative_return": portfolio_cumulative_return.values,
    })
    portfolio_daily_df["date"] = portfolio_daily_df["date"].apply(lambda dt: dt.date() if hasattr(dt, "date") else dt)
    
    # Clean up types
    for col in ["portfolio_return", "rolling_vol_30d", "drawdown", "cumulative_return"]:
        portfolio_daily_df[col] = portfolio_daily_df[col].apply(_safe_float)

    # ── Scalar aggregates (snapshot) ──
    n_years = max(len(returns) / 252, 0.001)

    # Per-asset annualized return
    per_asset_total_return = (1 + returns).prod() - 1
    per_asset_annualized_return = (1 + per_asset_total_return) ** (1 / n_years) - 1

    # Per-asset annualized volatility
    per_asset_annualized_vol = returns.std() * np.sqrt(252)

    # Per-asset Sharpe ratio (with safety check for zero vol)
    per_asset_sharpe = (per_asset_annualized_return - risk_free_rate) / per_asset_annualized_vol.replace(0, np.nan)

    # Per-asset max drawdown
    per_asset_max_drawdown = drawdown.min()

    # Portfolio-level scalars
    portfolio_total_return = (1 + portfolio_returns).prod() - 1
    portfolio_annualized_return = (1 + portfolio_total_return) ** (1 / n_years) - 1
    portfolio_annualized_vol = portfolio_returns.std() * np.sqrt(252)
    
    if portfolio_annualized_vol > 0:
        portfolio_sharpe = (portfolio_annualized_return - risk_free_rate) / portfolio_annualized_vol
    else:
        portfolio_sharpe = 0.0
        
    portfolio_max_drawdown = portfolio_drawdown.min()

    # Correlation matrix
    correlation_matrix = returns.corr().fillna(0)
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
