from __future__ import annotations
import logging
from .config import RouterConfig, Config
from .llm import ClaudeProvider, DeepSeekProvider, GeminiProvider, LLMResponse

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Hermes, a personal AI assistant. You are helpful, concise and direct.
You are running 24/7 on a private VPS owned by your operator.
Never reveal API keys, system configurations or private information.
Respond in the same language the user uses."""


class Router:
    def __init__(self, cfg: Config):
        self._cfg = cfg.router
        self._db_path = cfg.database.path
        self._spend_cap = cfg.anthropic.spend_cap_usd

        self._providers: dict[str, any] = {
            "claude": ClaudeProvider(cfg.anthropic.api_key, cfg.anthropic.model),
            "deepseek": DeepSeekProvider(cfg.deepseek.api_key, cfg.deepseek.model),
            "gemini": GeminiProvider(cfg.gemini.api_key, cfg.gemini.model),
        }

    def _select_provider(self, text: str, history: list[dict]) -> str:
        text_lower = text.lower().strip()

        # Explicit trigger prefix -> always Claude
        for prefix in self._cfg.claude_trigger_prefixes:
            if text_lower.startswith(prefix):
                log.debug("Claude trigger prefix matched: %s", prefix)
                return "claude"

        # Short messages -> cheap model
        word_count = len(text.split())
        if word_count <= self._cfg.short_message_max_tokens // 4:
            return self._cfg.default_provider

        return self._cfg.complex_provider

    async def _check_spend_cap(self) -> bool:
        from .db.queries import get_monthly_spend
        spend = await get_monthly_spend(self._db_path)
        total = spend.get("claude", 0.0)
        if total >= self._spend_cap:
            log.warning("Claude spend cap reached: $%.2f >= $%.2f", total, self._spend_cap)
            return False
        return True

    async def route(self, text: str, history: list[dict] | None = None) -> LLMResponse:
        history = history or []
        messages = history + [{"role": "user", "content": text}]

        provider_name = self._select_provider(text, history)

        # Enforce spend cap on Claude
        if provider_name == "claude":
            if not await self._check_spend_cap():
                provider_name = self._cfg.default_provider
                log.info("Falling back to %s (spend cap)", provider_name)

        provider = self._providers[provider_name]
        log.info("Routing to %s", provider_name)
        response = await provider.complete(messages, system=SYSTEM_PROMPT)

        # Fallback if provider errored
        if response.error and provider_name != self._cfg.free_fallback:
            log.warning("%s failed (%s), falling back to %s", provider_name, response.error, self._cfg.free_fallback)
            fallback = self._providers[self._cfg.free_fallback]
            response = await fallback.complete(messages, system=SYSTEM_PROMPT)

        return response
