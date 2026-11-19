from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class LLMResponse:
    text: str
    provider: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    error: Optional[str] = None


class LLMProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def complete(
        self,
        messages: list[dict],
        system: Optional[str] = None,
        max_tokens: int = 1024,
    ) -> LLMResponse:
        ...
