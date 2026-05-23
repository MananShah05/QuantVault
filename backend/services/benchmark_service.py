"""
Benchmark service — fetches and computes returns for comparison benchmarks (SPY or NIFTYBEES.NS).
"""

from datetime import date, timedelta
import logging

import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

def determine_benchmark(tickers: list[str]) -> str:
    """
    Select SPY for global/US portfolios and NIFTYBEES.NS if Indian equities exist.
    """
    is_indian = any(t.endswith(".NS") or t.endswith(".BO") for t in tickers)
    return "NIFTYBEES.NS" if is_indian else "SPY"

def fetch_benchmark_returns(benchmark_ticker: str, start_date: date, end_date: date) -> pd.Series:
    """
    Download benchmark prices from yfinance and return daily percent returns.
    """
    logger.info(f"Fetching benchmark '{benchmark_ticker}' from {start_date} to {end_date}")
    
    # Pad dates slightly to make sure we don't miss index boundary dates
    padded_start = start_date - timedelta(days=5)
    padded_end = end_date + timedelta(days=5)
    
    try:
        data = yf.download(benchmark_ticker, start=padded_start, end=padded_end, auto_adjust=True, progress=False)
        if data.empty:
            logger.warning(f"No price data found for benchmark {benchmark_ticker}")
            return pd.Series(dtype=float)
            
        prices = data["Close"].copy()
        if isinstance(prices, pd.DataFrame):
            prices = prices.iloc[:, 0]
        
        # Forward fill small gaps and compute daily returns
        prices = prices.ffill()
        daily_returns = prices.pct_change().dropna()
        
        # Standardize index to match date type
        if hasattr(daily_returns.index, "date"):
            daily_returns.index = daily_returns.index.date
            
        return daily_returns
    except Exception as e:
        logger.error(f"Failed to fetch benchmark returns: {e}")
        return pd.Series(dtype=float)

def compute_benchmark_metrics(
    portfolio_daily: pd.DataFrame, 
    benchmark_ticker: str, 
    start_date: date, 
    end_date: date
) -> pd.DataFrame:
    """
    Compute benchmark cumulative return, relative alpha, and tracking difference.
    
    Args:
        portfolio_daily: DataFrame containing at least ['date', 'cumulative_return', 'portfolio_return']
        benchmark_ticker: SPY or NIFTYBEES.NS
        start_date: first date of daily metrics
        end_date: last date of daily metrics
        
    Returns:
        DataFrame aligned with portfolio_daily, adding benchmark metrics
    """
    bench_returns = fetch_benchmark_returns(benchmark_ticker, start_date, end_date)
    
    # Align dates with the portfolio's dates
    aligned_returns = []
    for d in portfolio_daily["date"]:
        if d in bench_returns.index:
            aligned_returns.append(float(bench_returns.loc[d]))
        else:
            # Fallback to closest available date or 0.0
            aligned_returns.append(0.0)
            
    # Compute cumulative returns for benchmark
    aligned_returns_arr = np.array(aligned_returns)
    bench_cumulative = np.cumprod(1 + aligned_returns_arr) - 1
    
    # Create output columns
    result = portfolio_daily.copy()
    result["benchmark_return"] = aligned_returns
    result["benchmark_cumulative_return"] = bench_cumulative.tolist()
    
    # Relative Alpha = Portfolio Cumulative Return - Benchmark Cumulative Return
    result["relative_alpha"] = result["cumulative_return"] - result["benchmark_cumulative_return"]
    
    # Tracking Difference is equivalent to relative alpha on a cumulative return basis
    result["tracking_difference"] = result["relative_alpha"]
    
    return result
