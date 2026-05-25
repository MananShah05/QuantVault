"""
FastAPI application entry point.

- Creates tables on startup via Base.metadata.create_all
- Configures CORS for the Next.js frontend
- Registers all API routers under /api prefix
"""

import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().with_name(".env"))

from database import Base, engine
from routers import portfolios, assets, metrics, allocation, export

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables on startup and alter schema if needed."""
    logger.info("Starting up — creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Execute raw SQL to dynamically extend columns if not present
        from sqlalchemy import text
        logger.info("Verifying and extending database schema...")
        await conn.execute(text("ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);"))
        await conn.execute(text("ALTER TABLE portfolio_assets ADD COLUMN IF NOT EXISTS sector VARCHAR(50);"))
        await conn.execute(text("ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"))
        await conn.execute(text("ALTER TABLE portfolio_snapshots ADD COLUMN IF NOT EXISTS computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"))
        await conn.execute(text("ALTER TABLE portfolio_snapshots ADD COLUMN IF NOT EXISTS benchmark_return NUMERIC(10, 6);"))
        await conn.execute(text("ALTER TABLE portfolio_snapshots ADD COLUMN IF NOT EXISTS benchmark_cumulative_return NUMERIC(10, 6);"))
        
    logger.info("Database tables verified and updated successfully.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Portfolio Risk Dashboard API",
    description="Multi-Asset Portfolio Risk Dashboard — compute and visualize risk metrics",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins_env = os.getenv("CORS_ORIGINS", "")
cors_origins = [
    origin.strip()
    for origin in cors_origins_env.split(",")
    if origin.strip()
]
if not cors_origins:
    cors_origins = [
        "http://localhost:3000",
        "https://quant-vault-1.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(portfolios.router, prefix="/api")
app.include_router(assets.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(allocation.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "app": "Portfolio Risk Dashboard API",
        "version": "1.0.0",
        "docs": "/docs",
    }
