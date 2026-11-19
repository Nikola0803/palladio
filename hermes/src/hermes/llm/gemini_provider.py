from __future__ import annotations
import google.generativeai as genai
from .base import LLMProvider, LLMResponse


class GeminiProvider(LLMProvider):
    name = "gemini"

    def __init__(self, api_key: str, model: str):
        genai.configure(api_key=api_key)
        self._model_name = model
        self._model = genai.GenerativeModel(model)

    async def complete(self, messages, system=None, max_tokens=1024) -> LLMResponse:
        try:
            # Convert to Gemini format
            history = []
            last_user = ""
            for m in messages:
                if m["role"] == "user":
                    last_user = m["content"]
                elif m["role"] == "assistant":
                    history.append({"role": "model", "parts": [m["content"]]})
                    if last_user:
                        history.insert(-1, {"role": "user", "parts": [last_user]})
                        last_user = ""

            prompt = last_user or (messages[-1]["content"] if messages else "")
            if system:
                prompt = f"{system}\n\n{prompt}"

            resp = await self._model.generate_content_async(
                prompt,
                generation_config=genai.GenerationConfig(max_output_tokens=max_tokens),
            )
            text = resp.text or ""
            inp = resp.usage_metadata.prompt_token_count if resp.usage_metadata else 0
            out = resp.usage_metadata.candidates_token_count if resp.usage_metadata else 0

            return LLMResponse(
                text=text,
                provider="gemini",
                model=self._model_name,
                input_tokens=inp,
                output_tokens=out,
                cost_usd=0.0,  # free tier
            )
        except Exception as e:
            return LLMResponse(text="", provider="gemini", model=self._model_name, error=str(e))
