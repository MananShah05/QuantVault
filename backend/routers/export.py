"""
PDF export endpoint for institutional portfolio reports.
"""

import os
import re
import tempfile
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Portfolio
from services.auth import get_current_user
from routers.metrics import get_metrics, get_snapshot

import io
import pandas as pd
from models import PortfolioSnapshot

router = APIRouter(tags=["export"])


def _safe_filename(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value).strip("_") or "Portfolio"

def _derive_analytics_metrics(
    annualized_return: float | None,
    portfolio_volatility: float | None,
    max_drawdown: float | None,
    risk_free: float = 0.065,
) -> dict[str, float]:
    ann_return = annualized_return or 0.0
    vol = portfolio_volatility or 0.0
    max_dd = max_drawdown or 0.0

    calmar = ann_return / abs(max_dd) if abs(max_dd) > 0 else 0.0
    return_efficiency = ann_return / vol if vol > 0 else 0.0
    excess_return = ann_return - risk_free

    return {
        "calmar": calmar,
        "return_efficiency": return_efficiency,
        "excess_return": excess_return,
    }


@router.get("/portfolios/export-all-csv")
async def export_all_portfolios_csv(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    # Fetch all ready portfolios for user
    result = await db.execute(
        select(Portfolio)
        .where(and_(Portfolio.user_id == user_id, Portfolio.status == "ready"))
    )
    portfolios = result.scalars().all()
    
    if not portfolios:
        raise HTTPException(status_code=404, detail="No ready portfolios found")
        
    summary_data = []
    for p in portfolios:
        # Fetch latest snapshot
        snap_res = await db.execute(
            select(PortfolioSnapshot)
            .where(PortfolioSnapshot.portfolio_id == p.id)
            .order_by(PortfolioSnapshot.date.desc())
            .limit(1)
        )
        snap = snap_res.scalar_one_or_none()
        
        if snap and snap.annualized_return is not None:
            derived = _derive_analytics_metrics(
                annualized_return=float(snap.annualized_return) if snap.annualized_return is not None else None,
                portfolio_volatility=float(snap.portfolio_volatility) if snap.portfolio_volatility is not None else None,
                max_drawdown=float(snap.max_drawdown) if snap.max_drawdown is not None else None,
            )
            summary_data.append({
                "Portfolio Name": p.name,
                "Annualized Return": float(snap.annualized_return) if snap.annualized_return is not None else None,
                "Volatility": float(snap.portfolio_volatility) if snap.portfolio_volatility is not None else None,
                "Sharpe Ratio": float(snap.sharpe_ratio) if snap.sharpe_ratio is not None else None,
                "Max Drawdown": float(snap.max_drawdown) if snap.max_drawdown is not None else None,
                "Calmar Ratio": round(derived["calmar"], 6),
                "Return Efficiency": round(derived["return_efficiency"], 6),
                "Excess Return": round(derived["excess_return"], 6),
            })
            
    if not summary_data:
        raise HTTPException(status_code=404, detail="No snapshot data available for portfolios")
        
    df = pd.DataFrame(summary_data)
    output = io.StringIO()
    df.to_csv(output, index=False)
    
    filename = f"QuantVault_Portfolios_Summary_{date.today().isoformat()}.csv"
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/portfolios/{portfolio_id}/export-csv")
async def export_portfolio_csv(
    portfolio_id: UUID,
    range: str = Query(default="6M", pattern="^(1M|3M|6M|1Y|ALL)$"),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    # Fetch portfolio
    result = await db.execute(
        select(Portfolio).where(and_(Portfolio.id == portfolio_id, Portfolio.user_id == user_id))
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    metrics = await get_metrics(
        portfolio_id=portfolio_id,
        range=range,
        ticker=None,
        db=db,
        user_id=user_id,
    )
    snapshot = await get_snapshot(
        portfolio_id=portfolio_id,
        range=range,
        db=db,
        user_id=user_id,
    )

    rows: list[dict[str, object]] = []

    rows.append(
        {
            "section": "summary",
            "portfolio_id": str(portfolio.id),
            "portfolio_name": portfolio.name,
            "range": range,
            "date": snapshot.date,
            "annualized_return": snapshot.annualized_return,
            "volatility": snapshot.portfolio_volatility,
            "max_drawdown": snapshot.max_drawdown,
            "sharpe_ratio": snapshot.sharpe_ratio,
            "computed_at": snapshot.computed_at,
        }
    )

    for p in metrics.portfolio:
        rows.append(
            {
                "section": "portfolio_daily",
                "portfolio_id": str(portfolio.id),
                "portfolio_name": portfolio.name,
                "range": range,
                "date": p.date,
                "portfolio_return": p.portfolio_return,
                "rolling_vol_30d": p.rolling_vol_30d,
                "drawdown": p.drawdown,
                "cumulative_return": p.cumulative_return,
                "benchmark_return": p.benchmark_return,
                "benchmark_cumulative_return": p.benchmark_cumulative_return,
                "relative_alpha": p.relative_alpha,
                "tracking_difference": p.tracking_difference,
            }
        )

    for ticker, asset_rows in metrics.assets.items():
        for r in asset_rows:
            rows.append(
                {
                    "section": "asset_daily",
                    "portfolio_id": str(portfolio.id),
                    "portfolio_name": portfolio.name,
                    "range": range,
                    "date": r.date,
                    "ticker": ticker,
                    "rolling_vol_30d": r.rolling_vol_30d,
                    "cumulative_return": r.cumulative_return,
                }
            )

    if snapshot.per_asset:
        for ticker, stats in snapshot.per_asset.items():
            rows.append(
                {
                    "section": "asset_stats",
                    "portfolio_id": str(portfolio.id),
                    "portfolio_name": portfolio.name,
                    "range": range,
                    "ticker": ticker,
                    "annualized_return": stats.annualized_return,
                    "volatility": stats.volatility,
                    "max_drawdown": stats.max_drawdown,
                    "sharpe_ratio": stats.sharpe,
                }
            )

    df = pd.DataFrame(
        rows,
        columns=[
            "section",
            "portfolio_id",
            "portfolio_name",
            "range",
            "date",
            "ticker",
            "annualized_return",
            "volatility",
            "max_drawdown",
            "sharpe_ratio",
            "portfolio_return",
            "rolling_vol_30d",
            "drawdown",
            "cumulative_return",
            "benchmark_return",
            "benchmark_cumulative_return",
            "relative_alpha",
            "tracking_difference",
            "computed_at",
        ],
    )

    output = io.StringIO()
    df.to_csv(output, index=False)
    filename = f"QuantVault_{_safe_filename(portfolio.name)}_Performance_{date.today().isoformat()}.csv"

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/portfolios/{portfolio_id}/export-pdf")
async def export_portfolio_pdf(
    portfolio_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
    authorization: str = Header(None),
):
    result = await db.execute(
        select(Portfolio).where(and_(Portfolio.id == portfolio_id, Portfolio.user_id == user_id))
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="Playwright is not installed. Install backend requirements and run `playwright install chromium`.",
        ) from exc

    # Extract the raw JWT from the Authorization header to pass to Playwright
    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    report_url = f"{frontend_url}/portfolio/{portfolio_id}/report"
    filename = f"QuantVault_{_safe_filename(portfolio.name)}_{date.today().isoformat()}.pdf"
    output_path = os.path.join(tempfile.gettempdir(), filename)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            # Create a context so we can inject the session before navigating
            context = await browser.new_context(viewport={"width": 1280, "height": 1800}, device_scale_factor=2)
            page = await context.new_page()
            
            # Inject Supabase Auth session token to authorize API requests made by the report page
            if token:
                supabase_key = "sb-idmlgvazdabbrumoayin-auth-token"
                session_data = {
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {"id": user_id}
                }
                import json
                session_json = json.dumps(session_data).replace('"', '\\"')
                # Set local storage before navigating
                await page.add_init_script(
                    f"window.localStorage.setItem('{supabase_key}', '{session_json}');"
                )

            await page.goto(report_url, wait_until="networkidle", timeout=120_000)
            await page.wait_for_selector("[data-report-ready='true']", timeout=120_000)
            await page.pdf(
                path=output_path,
                format="A4",
                print_background=True,
                margin={"top": "16mm", "right": "14mm", "bottom": "18mm", "left": "14mm"},
                display_header_footer=True,
                footer_template=(
                    "<div style='font-size:8px;color:#777;width:100%;padding:0 14mm;"
                    "display:flex;justify-content:space-between;'>"
                    "<span>QuantVault Institutional Report</span>"
                    "<span>Generated <span class='date'></span> · Page <span class='pageNumber'></span>/<span class='totalPages'></span></span>"
                    "</div>"
                ),
                header_template="<div></div>",
            )
            await browser.close()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to export PDF: {exc}") from exc

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Cache-Control": "no-store"},
    )
