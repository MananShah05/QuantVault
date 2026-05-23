"""
Pydantic v2 schemas for request validation and response serialization.
"""

from __future__ import annotations

from datetime import date as dt_date, datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ──────────────── Request Schemas ────────────────


class AssetIn(BaseModel):
    """Single asset in a portfolio creation request."""
    ticker: str = Field(..., min_length=1, max_length=20)
    weight: float = Field(..., gt=0, le=1)
    asset_class: str = Field(default="equity", max_length=30)


class PortfolioCreateRequest(BaseModel):
    """Request body for POST /api/portfolios."""
    name: str = Field(..., min_length=3, max_length=50)
    assets: list[AssetIn] = Field(..., min_length=2, max_length=10)

    @field_validator("assets")
    @classmethod
    def no_duplicate_tickers(cls, v: list[AssetIn]) -> list[AssetIn]:
        tickers = [a.ticker.upper() for a in v]
        if len(tickers) != len(set(tickers)):
            raise ValueError("Duplicate tickers are not allowed")
        return v

    @model_validator(mode="after")
    def weights_must_sum_to_one(self) -> "PortfolioCreateRequest":
        total = sum(a.weight for a in self.assets)
        if abs(total - 1.0) > 0.001:
            raise ValueError(
                f"Asset weights must sum to 1.0 (got {total:.4f})"
            )
        return self


# ──────────────── Response Schemas ────────────────


class AssetResponse(BaseModel):
    """Asset within a portfolio response."""
    id: UUID
    ticker: str
    weight: float
    asset_class: str
    display_name: Optional[str] = None
    sector: Optional[str] = None

    model_config = {"from_attributes": True}


class SnapshotSummary(BaseModel):
    """Quick summary metrics for portfolio cards."""
    annualized_return: Optional[float] = None
    portfolio_volatility: Optional[float] = None
    max_drawdown: Optional[float] = None
    sharpe_ratio: Optional[float] = None

    model_config = {"from_attributes": True}


class PortfolioResponse(BaseModel):
    """Full portfolio object returned by create/get endpoints."""
    id: UUID
    name: str
    status: str
    created_at: datetime
    last_computed: Optional[datetime] = None
    user_id: Optional[str] = None
    assets: list[AssetResponse] = []

    model_config = {"from_attributes": True}


class PortfolioListItem(BaseModel):
    """Portfolio item for list endpoint with summary stats."""
    id: UUID
    name: str
    status: str
    created_at: datetime
    last_computed: Optional[datetime] = None
    user_id: Optional[str] = None
    assets: list[AssetResponse] = []
    latest_snapshot: Optional[SnapshotSummary] = None


class DailyMetricRow(BaseModel):
    """Single day of metrics for one asset."""
    date: dt_date
    price: Optional[float] = None
    daily_return: Optional[float] = None
    rolling_vol_30d: Optional[float] = None
    drawdown: Optional[float] = None
    cumulative_return: Optional[float] = None

    model_config = {"from_attributes": True}


class PortfolioDailyRow(BaseModel):
    """Single day of portfolio-level metrics."""
    date: dt_date
    portfolio_return: Optional[float] = None
    rolling_vol_30d: Optional[float] = None
    drawdown: Optional[float] = None
    cumulative_return: Optional[float] = None
    benchmark_return: Optional[float] = None
    benchmark_cumulative_return: Optional[float] = None
    relative_alpha: Optional[float] = None
    tracking_difference: Optional[float] = None

    model_config = {"from_attributes": True}


class MetricsResponse(BaseModel):
    """Response for GET /api/portfolios/{id}/metrics."""
    portfolio_id: UUID
    range: str
    assets: dict[str, list[DailyMetricRow]]
    portfolio: list[PortfolioDailyRow]


class PerAssetStats(BaseModel):
    """Per-asset aggregate risk stats."""
    annualized_return: float
    volatility: float
    sharpe: float
    max_drawdown: float


class SnapshotResponse(BaseModel):
    """Response for GET /api/portfolios/{id}/snapshot."""
    portfolio_id: UUID
    date: Optional[dt_date] = None
    annualized_return: Optional[float] = None
    portfolio_volatility: Optional[float] = None
    max_drawdown: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    correlation_matrix: Optional[dict] = None
    per_asset: Optional[dict[str, PerAssetStats]] = None
    computed_at: Optional[datetime] = None


class DateRange(BaseModel):
    """Date range for compute result."""
    from_date: dt_date = Field(..., alias="from")
    to_date: dt_date = Field(..., alias="to")

    model_config = {"populate_by_name": True}


class ComputeResult(BaseModel):
    """Response for POST /api/portfolios/{id}/compute."""
    status: str
    assets_processed: int
    date_range: dict
    rows_written: int
    duration_seconds: float


class AssetSearchResult(BaseModel):
    """Response for GET /api/assets/search."""
    ticker: str
    name: str
    exchange: Optional[str] = None
    asset_class: str


class SectorConcentrationItem(BaseModel):
    sector: str
    weight: float


class AllocationSummaryResponse(BaseModel):
    portfolio_id: UUID
    total_exposure: float
    intra_portfolio_correlation: float
    sector_concentration: list[SectorConcentrationItem]
    diversification_score: float
    top_sector: str
    as_of_date: str

