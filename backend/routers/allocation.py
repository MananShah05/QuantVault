"""
Allocation router — returns portfolio-level allocation and diversification summary metrics.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas import AllocationSummaryResponse
from services.allocation_service import get_allocation_summary
from services.auth import get_current_user

router = APIRouter(tags=["allocation"])

@router.get("/portfolios/{portfolio_id}/allocation-summary", response_model=AllocationSummaryResponse)
async def fetch_allocation_summary(
    portfolio_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """
    Get portfolio allocation summary metrics: total exposure,
    sector concentration, intra-portfolio correlation, and diversification score.
    """
    try:
        summary = await get_allocation_summary(portfolio_id, db, user_id=user_id)
        return summary
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": str(e), "code": "PORTFOLIO_NOT_FOUND"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"detail": f"Failed to compute allocation summary: {str(e)}"},
        )
