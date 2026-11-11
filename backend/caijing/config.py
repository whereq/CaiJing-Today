"""Application configuration management.

Reads from environment / .env. Every default is a safe, self-contained local
value: a PostgreSQL on localhost and a placeholder OpenID Connect issuer. Point
them at your own infrastructure by setting the environment variables — nothing
about any particular deployment is baked in.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """CaiJing Today API settings loaded from environment variables."""

    # Database — PostgreSQL 12+ (verified on 17). The schema this API reads is
    # published as a contract in docs/SCHEMA.sql; apply it (and, optionally, the
    # synthetic demo data) before starting the API.
    database_url: str = "postgresql+asyncpg://caijing:caijing@localhost:5432/caijing"

    # Keycloak / JWT (public client — SPA). The shipped values are placeholders:
    # point them at your own OIDC issuer and realm. Browsing is public, so the
    # API and the UI both work with no identity provider configured at all.
    keycloak_url: str = "https://auth.example.com"
    keycloak_realm: str = "caijing-today"
    keycloak_client_id: str = "caijing-today-spa"

    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
    ]

    # Default look-back window (hours) for "hot" ranking and flash feeds.
    news_default_window_hours: int = 24

    # The API serves real data when a database is attached. Seed fallback stays
    # available for offline/local dev with no DB — enable it via env when there
    # is no database attached.
    seed_fallback_enabled: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
