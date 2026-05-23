"""
SQLAlchemy ORM models for the Portfolio Risk Dashboard.

Tables:
  - portfolios: Top-level portfolio metadata
  - portfolio_assets: Assets + weights per portfolio
  - daily_metrics: Per-asset, per-date computed risk metrics
  - portfolio_snapshots: Daily portfolio-level aggregates + correlation matrix
"""

from uuid import uuid4
from sqlalchemy import (
    Column, String, Date, DateTime, Numeric, ForeignKey, Index, UniqueConstraint, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_computed = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(String(100), nullable=True, index=True)

    # Relationships — cascade delete all children
    assets = relationship(
        "PortfolioAsset", back_populates="portfolio", cascade="all, delete-orphan"
    )
    metrics = relationship(
        "DailyMetric", back_populates="portfolio", cascade="all, delete-orphan"
    )
    snapshots = relationship(
        "PortfolioSnapshot", back_populates="portfolio", cascade="all, delete-orphan"
    )


class PortfolioAsset(Base):
    __tablename__ = "portfolio_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    portfolio_id = Column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False
    )
    ticker = Column(String(20), nullable=False)
    weight = Column(Numeric(6, 4), nullable=False)
    asset_class = Column(String(30), nullable=False, default="equity")
    display_name = Column(String(100), nullable=True)
    sector = Column(String(50), nullable=True)

    portfolio = relationship("Portfolio", back_populates="assets")

    __table_args__ = (
        UniqueConstraint("portfolio_id", "ticker", name="unique_ticker_per_portfolio"),
        CheckConstraint("weight > 0 AND weight <= 1", name="weight_range"),
    )


class DailyMetric(Base):
    __tablename__ = "daily_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    portfolio_id = Column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False
    )
    ticker = Column(String(20), nullable=False)
    date = Column(Date, nullable=False)
    price = Column(Numeric(14, 4))
    daily_return = Column(Numeric(10, 6))
    rolling_vol_30d = Column(Numeric(10, 6))
    rolling_vol_60d = Column(Numeric(10, 6))
    drawdown = Column(Numeric(10, 6))
    cumulative_return = Column(Numeric(10, 6))
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    portfolio = relationship("Portfolio", back_populates="metrics")

    __table_args__ = (
        UniqueConstraint(
            "portfolio_id", "ticker", "date", name="unique_metric_per_asset_date"
        ),
        Index("idx_daily_metrics_portfolio_date", "portfolio_id", "date"),
        Index("idx_daily_metrics_ticker", "portfolio_id", "ticker", "date"),
    )


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    portfolio_id = Column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False
    )
    date = Column(Date, nullable=False)
    portfolio_return = Column(Numeric(10, 6))
    rolling_vol_30d = Column(Numeric(10, 6))
    drawdown = Column(Numeric(10, 6))
    cumulative_return = Column(Numeric(10, 6))
    annualized_return = Column(Numeric(10, 6))
    portfolio_volatility = Column(Numeric(10, 6))
    max_drawdown = Column(Numeric(10, 6))
    sharpe_ratio = Column(Numeric(8, 4))
    correlation_matrix = Column(JSONB)
    benchmark_return = Column(Numeric(10, 6), nullable=True)
    benchmark_cumulative_return = Column(Numeric(10, 6), nullable=True)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    portfolio = relationship("Portfolio", back_populates="snapshots")

    __table_args__ = (
        UniqueConstraint("portfolio_id", "date", name="unique_snapshot_per_date"),
        Index("idx_snapshots_portfolio_date", "portfolio_id", "date"),
    )
