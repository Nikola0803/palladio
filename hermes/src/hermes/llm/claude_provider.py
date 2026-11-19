from __future__ import annotations
import anthropic
from .base import LLMProvider, LLMResponse

# Pricing as of 2025: claude-sonnet-4-5
_INPUT_PRICE = 3.00 / 1_000_000
_OUTPUT_PRICE = 15.00 / 1_000_000


class ClaudeProvider(LLMProvider):
    name = "claude"

    def __init__(self, api_key: str, model: str):
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model

    async def complete(self, messages, system=None, max_tokens=1024) -> LLMResponse:
        try:
            kwargs = {"model": self._model, "messages": messages, "max_tokens": max_tokens}
            if system:
                kwargs["system"] = system

            resp = await self._client.messages.create(**kwargs)
            text = resp.content[0].text
            inp = resp.usage.input_tokens
            out = resp.usage.output_tokens
            cost = inp * _INPUT_PRICE + out * _OUTPUT_PRICE

            return LLMResponse(
                text=text,
                provider="claude",
                model=self._model,
                input_tokens=inp,
                output_tokens=out,
                cost_usd=cost,
            )
        except Exception as e:
            return LLMResponse(text="", provider="claude", model=self._model, error=str(e))
