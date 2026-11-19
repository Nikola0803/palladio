from __future__ import annotations
from datetime import datetime
import aiosqlite
from ..llm.base import LLMResponse


async def log_message(db_path: str, user_text: str, response: LLMResponse) -> None:
    month = datetime.utcnow().strftime("%Y-%m")
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            """INSERT INTO messages (direction, provider, model, user_text, agent_text,
               input_tok, output_tok, cost_usd) VALUES (?,?,?,?,?,?,?,?)""",
            ("in", response.provider, response.model, user_text, response.text,
             response.input_tokens, response.output_tokens, response.cost_usd),
        )
        await db.execute(
            """INSERT INTO monthly_spend (month, provider, total_usd) VALUES (?,?,?)
               ON CONFLICT(month, provider) DO UPDATE SET total_usd = total_usd + excluded.total_usd""",
            (month, response.provider, response.cost_usd),
        )
        await db.commit()


async def get_recent_messages(db_path: str, limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM messages ORDER BY created_at DESC LIMIT ?", (limit,)
        ) as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def get_monthly_spend(db_path: str) -> dict[str, float]:
    month = datetime.utcnow().strftime("%Y-%m")
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT provider, total_usd FROM monthly_spend WHERE month=?", (month,)
        ) as cur:
            rows = await cur.fetchall()
    return {r["provider"]: r["total_usd"] for r in rows}
