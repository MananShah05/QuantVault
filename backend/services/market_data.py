"""
Market data service — fetches price data and validates tickers via yfinance.
"""

import yfinance as yf
import pandas as pd
import logging
import os
import httpx

logger = logging.getLogger(__name__)

# Map yfinance quoteType to our asset_class enum
QUOTE_TYPE_MAP = {
    "EQUITY": "equity",
    "ETF": "equity",
    "MUTUALFUND": "equity",
    "CURRENCY": "fx",
    "FUTURE": "commodity",
    "CRYPTOCURRENCY": "crypto",
    "INDEX": "equity",
}


def fetch_prices(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    """
    Download adjusted close prices for multiple tickers from Yahoo Finance.

    Args:
        tickers: List of yfinance ticker symbols (e.g. ["AAPL", "GLD"])
        period: How far back to fetch (e.g. "2y", "1y", "6mo")

    Returns:
        DataFrame with DatetimeIndex, one column per ticker, values = adjusted close

    Raises:
        ValueError: If any ticker returns empty data
    """
    logger.info(f"Fetching prices for {tickers} over period={period}")

    if len(tickers) == 1:
        # yfinance returns a Series for single tickers, handle differently
        data = yf.download(tickers[0], period=period, auto_adjust=True, progress=False)
        if data.empty:
            raise ValueError(f"Ticker '{tickers[0]}' returned no data from yfinance")
        prices = data[["Close"]].copy()
        prices.columns = [tickers[0]]
    else:
        data = yf.download(tickers, period=period, auto_adjust=True, progress=False)
        if data.empty:
            raise ValueError(f"No data returned for tickers: {tickers}")

        # yfinance returns MultiIndex columns (metric, ticker) for multiple tickers
        if isinstance(data.columns, pd.MultiIndex):
            prices = data["Close"].copy()
        else:
            prices = data[["Close"]].copy()
            prices.columns = tickers

    # Check for tickers with all-NaN data
    empty_tickers = [t for t in prices.columns if prices[t].isna().all()]
    if empty_tickers:
        raise ValueError(
            f"The following tickers returned no data: {empty_tickers}"
        )

    # Forward-fill small gaps (weekends/holidays across markets), then drop remaining NaNs
    prices = prices.ffill().dropna()

    logger.info(f"Fetched {len(prices)} rows for {list(prices.columns)}")
    return prices


def search_tickers(query: str) -> list[dict]:
    """
    Search for ticker symbols using Finnhub.
    """
    api_key = os.getenv("FINNHUB_API_KEY", "d8908npr01qs9ff6fn0gd8908npr01qs9ff6fn10")
    try:
        response = httpx.get(
            "https://finnhub.io/api/v1/search",
            params={"q": query, "token": api_key},
            timeout=5.0
        )
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data.get("result", [])[:10]:
            item_type = item.get("type", "").lower()
            if "crypto" in item_type:
                asset_class = "crypto"
            elif "etf" in item_type or "fund" in item_type:
                asset_class = "equity"
            elif "currency" in item_type or "fx" in item_type:
                asset_class = "fx"
            else:
                asset_class = "equity"
                
            results.append({
                "ticker": item.get("symbol"),
                "name": item.get("description"),
                "exchange": "US",
                "asset_class": asset_class,
            })
            
        if not results:
            raise ValueError(f"No results found for '{query}'")
            
        return results
        
    except Exception as e:
        logger.error(f"Finnhub search failed: {str(e)}")
        raise ValueError(f"Failed to search for '{query}'")
