"""
Market data service — fetches price data and validates tickers via yfinance.
"""

import asyncio
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


async def fetch_prices(tickers: list[str], period: str = "2y") -> pd.DataFrame:
    """
    Download adjusted close prices for multiple tickers from Yahoo Finance.
    Wrapped in asyncio.to_thread to avoid blocking the event loop.
    """
    logger.info(f"Fetching prices for {tickers} over period={period}")

    def _download():
        if len(tickers) == 1:
            return yf.download(tickers[0], period=period, auto_adjust=True, progress=False)
        return yf.download(tickers, period=period, auto_adjust=True, progress=False)

    data = await asyncio.to_thread(_download)

    if data.empty:
        if len(tickers) == 1:
            raise ValueError(f"Ticker '{tickers[0]}' returned no data from yfinance")
        raise ValueError(f"No data returned for tickers: {tickers}")

    if len(tickers) == 1:
        prices = data[["Close"]].copy()
        prices.columns = [tickers[0]]
    else:
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


async def search_tickers(query: str) -> list[dict]:
    """
    Search for ticker symbols using Finnhub.
    """
    api_key = os.getenv("FINNHUB_API_KEY", "d8908npr01qs9ff6fn0gd8908npr01qs9ff6fn10")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://finnhub.io/api/v1/search",
                params={"q": query, "token": api_key},
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
