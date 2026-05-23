"""
Portfolio CRUD endpoints.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from database import get_db
from models import Portfolio, PortfolioAsset, PortfolioSnapshot
from schemas import (
    PortfolioCreateRequest,
    PortfolioResponse,
    PortfolioListItem,
    SnapshotSummary,
    AssetResponse,
)
from services.auth import get_current_user

router = APIRouter(tags=["portfolios"])


@router.post("/portfolios", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    request: PortfolioCreateRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Create a new portfolio with assets and weights."""

    # Create portfolio associated with the authenticated user
    portfolio = Portfolio(
        name=request.name,
        status="pending_computation",
        user_id=user_id
    )
    db.add(portfolio)
    await db.flush()  # Get the ID

    # Create assets
    for asset_in in request.assets:
        asset = PortfolioAsset(
            portfolio_id=portfolio.id,
            ticker=asset_in.ticker.upper(),
            weight=asset_in.weight,
            asset_class=asset_in.asset_class,
        )
        db.add(asset)

    await db.commit()
    await db.refresh(portfolio)

    # Reload with assets relationship, ensuring it belongs to the user
    result = await db.execute(
        select(Portfolio)
        .options(selectinload(Portfolio.assets))
        .where(and_(Portfolio.id == portfolio.id, Portfolio.user_id == user_id))
    )
    portfolio = result.scalar_one()

    return portfolio


@router.get("/portfolios", response_model=list[PortfolioListItem])
async def list_portfolios(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """List all portfolios for the authenticated user with latest snapshot summary."""

    # Subquery to get the latest snapshot date per portfolio
    latest_snapshot_subq = (
        select(
            PortfolioSnapshot.portfolio_id,
            func.max(PortfolioSnapshot.date).label("latest_date"),
        )
        .group_by(PortfolioSnapshot.portfolio_id)
        .subquery()
    )

    # Join portfolios with their latest snapshot and filter by user_id
    result = await db.execute(
        select(Portfolio, PortfolioSnapshot)
        .join(
            latest_snapshot_subq,
            Portfolio.id == latest_snapshot_subq.c.portfolio_id,
            isouter=True,
        )
        .join(
            PortfolioSnapshot,
            and_(
                PortfolioSnapshot.portfolio_id == latest_snapshot_subq.c.portfolio_id,
                PortfolioSnapshot.date == latest_snapshot_subq.c.latest_date,
            ),
            isouter=True,
        )
        .where(Portfolio.user_id == user_id)
        .options(selectinload(Portfolio.assets))
    )

    items = []
    for row in result.unique().all():
        portfolio = row[0]
        snapshot = row[1]

        latest_snapshot = None
        if snapshot and snapshot.annualized_return is not None:
            latest_snapshot = SnapshotSummary(
                annualized_return=float(snapshot.annualized_return) if snapshot.annualized_return else None,
                portfolio_volatility=float(snapshot.portfolio_volatility) if snapshot.portfolio_volatility else None,
                max_drawdown=float(snapshot.max_drawdown) if snapshot.max_drawdown else None,
                sharpe_ratio=float(snapshot.sharpe_ratio) if snapshot.sharpe_ratio else None,
            )

        items.append(
            PortfolioListItem(
                id=portfolio.id,
                name=portfolio.name,
                status=portfolio.status,
                created_at=portfolio.created_at,
                last_computed=portfolio.last_computed,
                assets=[AssetResponse.model_validate(a) for a in portfolio.assets],
                latest_snapshot=latest_snapshot,
            )
        )

    return items


@router.get("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Get full portfolio details including assets, scoped by user."""
    result = await db.execute(
        select(Portfolio)
        .options(selectinload(Portfolio.assets))
        .where(and_(Portfolio.id == portfolio_id, Portfolio.user_id == user_id))
    )
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": f"Portfolio {portfolio_id} not found", "code": "PORTFOLIO_NOT_FOUND"},
        )

    return portfolio


@router.delete("/portfolios/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    """Delete portfolio and all associated data (cascading), scoped by user."""
    result = await db.execute(
        select(Portfolio).where(and_(Portfolio.id == portfolio_id, Portfolio.user_id == user_id))
    )
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"detail": f"Portfolio {portfolio_id} not found", "code": "PORTFOLIO_NOT_FOUND"},
        )

    await db.delete(portfolio)
    await db.commit()
