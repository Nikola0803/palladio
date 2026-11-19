from __future__ import annotations
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from ..db.queries import get_recent_messages, get_monthly_spend

TEMPLATES_DIR = Path(__file__).parent / "templates"

app = FastAPI(title="Hermes Dashboard", docs_url=None, redoc_url=None)
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

_db_path: str = ""


def configure(db_path: str) -> None:
    global _db_path
    _db_path = db_path


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    messages = await get_recent_messages(_db_path, limit=50)
    spend = await get_monthly_spend(_db_path)
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "messages": messages, "spend": spend},
    )


@app.get("/api/messages")
async def api_messages():
    return await get_recent_messages(_db_path, limit=100)


@app.get("/api/spend")
async def api_spend():
    return await get_monthly_spend(_db_path)


@app.get("/api/status")
async def api_status():
    return {"status": "running", "db": _db_path}
