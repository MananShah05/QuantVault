"""
Asset search endpoint — validates tickers via yfinance.
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from schemas import AssetSearchResult
from services.market_data import validate_ticker
from services.auth import get_current_user

router = APIRouter(tags=["assets"])


@router.get("/assets/search", response_model=list[AssetSearchResult])
async def search_assets(
    q: str = Query(..., min_length=1, max_length=20),
    user_id: str = Depends(get_current_user),
):
    """
    Search for a valid ticker symbol.
    Uses yfinance to validate and return metadata.
    Requires authentication.
    """
    try:
        result = validate_ticker(q.strip())
        return [AssetSearchResult(**result)]
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"detail": str(e), "code": "TICKER_NOT_FOUND"},
        )

