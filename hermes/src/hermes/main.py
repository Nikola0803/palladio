#!/usr/bin/env python3
from __future__ import annotations
import asyncio
import logging
import sys
import uvicorn
from .config import load_config
from .db.models import init_db
from .router import Router
from .telegram_bot import build_app
from .dashboard.app import app as dashboard_app, configure as configure_dashboard


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


async def main():
    cfg = load_config()
    setup_logging(cfg.server.get("log_level", "INFO"))
    log = logging.getLogger("hermes")

    log.info("Initializing database at %s", cfg.database.path)
    await init_db(cfg.database.path)

    configure_dashboard(cfg.database.path)

    router = Router(cfg)
    tg_app = build_app(
        bot_token=cfg.telegram.bot_token,
        owner_id=cfg.telegram.owner_user_id,
        router=router,
        db_path=cfg.database.path,
    )

    # Run Telegram bot + dashboard concurrently
    uv_config = uvicorn.Config(
        dashboard_app,
        host=cfg.dashboard.host,
        port=cfg.dashboard.port,
        log_level="warning",
    )
    uv_server = uvicorn.Server(uv_config)

    log.info("Starting Hermes -- Telegram polling + dashboard on %s:%d",
             cfg.dashboard.host, cfg.dashboard.port)

    await asyncio.gather(
        tg_app.run_polling(drop_pending_updates=True),
        uv_server.serve(),
    )


def run():
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    run()
