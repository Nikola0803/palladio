import aiosqlite
from pathlib import Path

CREATE_MESSAGES = """
CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    direction   TEXT NOT NULL,       -- 'in' | 'out'
    provider    TEXT,                -- 'deepseek' | 'claude' | 'gemini'
    model       TEXT,
    user_text   TEXT,
    agent_text  TEXT,
    input_tok   INTEGER DEFAULT 0,
    output_tok  INTEGER DEFAULT 0,
    cost_usd    REAL DEFAULT 0.0
)
"""

CREATE_SPEND = """
CREATE TABLE IF NOT EXISTS monthly_spend (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    month       TEXT NOT NULL,       -- 'YYYY-MM'
    provider    TEXT NOT NULL,
    total_usd   REAL DEFAULT 0.0,
    UNIQUE(month, provider)
)
"""


async def init_db(db_path: str) -> None:
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(db_path) as db:
        await db.execute(CREATE_MESSAGES)
        await db.execute(CREATE_SPEND)
        await db.commit()
