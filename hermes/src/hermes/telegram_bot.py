from __future__ import annotations
import logging
from functools import wraps
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from .router import Router
from .db.queries import log_message, get_monthly_spend

log = logging.getLogger(__name__)


def owner_only(owner_id: int):
    def decorator(func):
        @wraps(func)
        async def wrapper(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
            if update.effective_user.id != owner_id:
                log.warning("Blocked unauthorized user %d", update.effective_user.id)
                return
            return await func(update, ctx)
        return wrapper
    return decorator


def build_app(bot_token: str, owner_id: int, router: Router, db_path: str) -> Application:
    app = Application.builder().token(bot_token).build()

    @owner_only(owner_id)
    async def handle_message(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        text = update.message.text or ""
        await update.message.chat.send_action("typing")

        # Simple context window: last 10 messages from chat data
        history = ctx.chat_data.get("history", [])
        response = await router.route(text, history)

        if response.error and not response.text:
            await update.message.reply_text("Something went wrong. Try again.")
            return

        reply = response.text
        await update.message.reply_text(reply)

        # Update history (keep last 10 exchanges = 20 messages)
        history.append({"role": "user", "content": text})
        history.append({"role": "assistant", "content": reply})
        ctx.chat_data["history"] = history[-20:]

        await log_message(db_path, text, response)

    @owner_only(owner_id)
    async def cmd_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        spend = await get_monthly_spend(db_path)
        lines = ["*Hermes Status*", "Agent: running"]
        for provider, cost in spend.items():
            lines.append(f"{provider}: ${cost:.4f} this month")
        if not spend:
            lines.append("No spend recorded yet.")
        await update.message.reply_text("\n".join(lines), parse_mode="Markdown")

    @owner_only(owner_id)
    async def cmd_reset(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        ctx.chat_data["history"] = []
        await update.message.reply_text("Conversation history cleared.")

    @owner_only(owner_id)
    async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        msg = (
            "*Hermes Commands*\n"
            "/status - show monthly spend\n"
            "/reset - clear conversation history\n"
            "/help - this message\n\n"
            "*Trigger prefixes (force Claude):*\n"
            "/code, /analyze, /plan, /think, /research"
        )
        await update.message.reply_text(msg, parse_mode="Markdown")

    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("reset", cmd_reset))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    return app
