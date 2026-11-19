from __future__ import annotations
from openai import AsyncOpenAI
from .base import LLMProvider, LLMResponse

# DeepSeek V3 pricing
_INPUT_PRICE = 0.14 / 1_000_000
_OUTPUT_PRICE = 0.28 / 1_000_000


class DeepSeekProvider(LLMProvider):
    name = "deepseek"

    def __init__(self, api_key: str, model: str):
        self._client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1",
        )
        self._model = model

    async def complete(self, messages, system=None, max_tokens=1024) -> LLMResponse:
        try:
            full_messages = messages
            if system:
                full_messages = [{"role": "system", "content": system}] + messages

            resp = await self._client.chat.completions.create(
                model=self._model,
                messages=full_messages,
                max_tokens=max_tokens,
            )
            text = resp.choices[0].message.content or ""
            inp = resp.usage.prompt_tokens if resp.usage else 0
            out = resp.usage.completion_tokens if resp.usage else 0
            cost = inp * _INPUT_PRICE + out * _OUTPUT_PRICE

            return LLMResponse(
                text=text,
                provider="deepseek",
                model=self._model,
                input_tokens=inp,
                output_tokens=out,
                cost_usd=cost,
            )
        except Exception as e:
            return LLMResponse(text="", provider="deepseek", model=self._model, error=str(e))
