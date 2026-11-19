from __future__ import annotations
import os
from pathlib import Path
from typing import Optional
import yaml
from pydantic import BaseModel, Field


class TelegramConfig(BaseModel):
    bot_token: str
    owner_user_id: int


class AnthropicConfig(BaseModel):
    api_key: str
    model: str = "claude-sonnet-4-5"
    spend_cap_usd: float = 20.0


class DeepSeekConfig(BaseModel):
    api_key: str
    model: str = "deepseek-chat"


class GeminiConfig(BaseModel):
    api_key: str
    model: str = "gemini-2.0-flash"


class RouterConfig(BaseModel):
    default_provider: str = "deepseek"
    complex_provider: str = "claude"
    free_fallback: str = "gemini"
    short_message_max_tokens: int = 150
    claude_trigger_prefixes: list[str] = Field(
        default=["/code", "/analyze", "/plan", "/think", "/research"]
    )


class DatabaseConfig(BaseModel):
    path: str = "/home/hermes/.hermes/hermes.db"


class DashboardConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8080
    secret_key: str = "change-me"


class Config(BaseModel):
    telegram: TelegramConfig
    anthropic: AnthropicConfig
    deepseek: DeepSeekConfig
    gemini: GeminiConfig
    router: RouterConfig = RouterConfig()
    database: DatabaseConfig = DatabaseConfig()
    dashboard: DashboardConfig = DashboardConfig()
    server: dict = {}


def load_config(path: Optional[str] = None) -> Config:
    cfg_path = path or os.getenv("HERMES_CONFIG", "/etc/hermes/config.yaml")
    with open(cfg_path) as f:
        raw = yaml.safe_load(f)
    return Config(**raw)
