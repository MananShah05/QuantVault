"""
PDF export endpoint for institutional portfolio reports.
"""

import os
import re
import tempfile
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import FileResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Portfolio
from services.auth import get_current_user

router = APIRouter(tags=["export"])


def _safe_filename(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value).strip("_") or "Portfolio"


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
