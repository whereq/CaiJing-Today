"""Unit tests for the market panels' degradation behaviour.

A missing `cj_*` table must degrade to an empty list, never to a 500 — the
frontend renders "no data" for an empty panel and hides it.
"""

from unittest.mock import AsyncMock

import pytest

from caijing import market_service


@pytest.fixture(autouse=True)
def _no_seed_fallback(monkeypatch):
    """Seed data must not mask a broken table in these tests."""
    monkeypatch.setattr(market_service.settings, "seed_fallback_enabled", False)


def _failing_db(message: str = "relation does not exist") -> AsyncMock:
    db = AsyncMock()
    db.execute.side_effect = Exception(message)
    return db


@pytest.mark.asyncio
async def test_get_quotes_returns_empty_when_the_table_is_missing():
    assert await market_service.get_quotes(_failing_db()) == []


@pytest.mark.asyncio
async def test_get_charts_returns_empty_when_the_table_is_missing():
    assert await market_service.get_charts(_failing_db()) == []


@pytest.mark.asyncio
async def test_get_hot_stocks_returns_empty_when_the_table_is_missing():
    assert await market_service.get_hot_stocks(_failing_db()) == []


@pytest.mark.asyncio
async def test_get_sectors_returns_empty_when_the_table_is_missing():
    assert await market_service.get_sectors(_failing_db()) == []


@pytest.mark.asyncio
async def test_get_calendar_returns_empty_when_the_table_is_missing():
    assert await market_service.get_calendar(_failing_db()) == []


@pytest.mark.asyncio
async def test_get_keywords_returns_empty_when_the_table_is_missing():
    assert await market_service.get_keywords(_failing_db()) == []


@pytest.mark.asyncio
async def test_get_crypto_returns_empty_bundles_when_the_tables_are_missing():
    bundle = await market_service.get_crypto(_failing_db())
    assert bundle.coins == []
    assert bundle.chains == []
    assert bundle.stats == []
    assert bundle.new_tokens == []
