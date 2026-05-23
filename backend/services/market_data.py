"""
Market data service — fetches price data and validates tickers via yfinance.
"""

import yfinance as yf
import pandas as pd
import logging

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


def validate_ticker(ticker: str) -> dict:
    """
    Validate a ticker symbol using yfinance and return metadata.

    Args:
        ticker: Ticker symbol to validate (e.g. "AAPL", "GLD", "USDINR=X")

    Returns:
        Dict with keys: ticker, name, exchange, asset_class

    Raises:
        ValueError: If ticker is invalid or not found
    """
    try:
        t = yf.Ticker(ticker)
        info = t.info

        if not info or info.get("regularMarketPrice") is None:
            # Try a quick history fetch as a fallback validation
            hist = t.history(period="5d")
            if hist.empty:
                raise ValueError(f"Ticker '{ticker}' not found on yfinance")

        quote_type = info.get("quoteType", "EQUITY")
        asset_class = QUOTE_TYPE_MAP.get(quote_type, "equity")

        return {
            "ticker": ticker.upper(),
            "name": info.get("shortName") or info.get("longName") or ticker,
            "exchange": info.get("exchange", "Unknown"),
            "asset_class": asset_class,
        }

    except Exception as e:
        if "not found" in str(e).lower() or "no data" in str(e).lower():
            raise ValueError(f"Ticker '{ticker}' not found on yfinance")
        raise ValueError(f"Failed to validate ticker '{ticker}': {str(e)}")
