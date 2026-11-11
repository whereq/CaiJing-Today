"""Unit tests for the news service shaping logic.

These run without a database: the SQLAlchemy session is mocked and the
service's pure shaping functions are exercised directly.
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from caijing import news_service
from caijing.models import CjNewsMeta, MarketNewsItem, MarketSignal


def make_card(id_: int, title: str = "央行公开市场操作", heat: float | None = None) -> news_service.NewsCard:
    from api.schemas.news import NewsCard

    return NewsCard(
        id=id_,
        title=title,
        title_cn=title,
        title_en=title,
        source="gdelt",
        category="macro",
        published_at=news_service.iso_utc(datetime(2026, 8, 12, 12, 0, 0)),
        heat=heat if heat is not None else 50.0,
    )


@pytest.fixture(autouse=True)
def _reset_view_state():
    """The view-availability flag is module-level; reset it between tests."""
    news_service._view_state.update({"available": None, "checked_at": 0.0})
    yield
    news_service._view_state.update({"available": None, "checked_at": 0.0})


# ── search: the true match count ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_search_reports_total_beyond_the_page(monkeypatch):
    """`total` counts every match, not just the ones that fit on the page."""
    cards = [make_card(i) for i in range(10)]

    async def fake_get_cards(db, **kwargs):
        return cards

    monkeypatch.setattr(news_service, "get_cards", fake_get_cards)

    results, total = await news_service.search(AsyncMock(), query="央行", hours=24, limit=3)

    assert len(results) == 3
    assert total == 10


@pytest.mark.asyncio
async def test_search_total_is_zero_when_nothing_matches(monkeypatch):
    async def fake_get_cards(db, **kwargs):
        return [make_card(i) for i in range(3)]

    monkeypatch.setattr(news_service, "get_cards", fake_get_cards)

    results, total = await news_service.search(AsyncMock(), query="不存在的词", hours=24, limit=30)

    assert results == []
    assert total == 0


@pytest.mark.asyncio
async def test_search_with_empty_query_returns_everything(monkeypatch):
    cards = [make_card(i) for i in range(4)]

    async def fake_get_cards(db, **kwargs):
        return cards

    monkeypatch.setattr(news_service, "get_cards", fake_get_cards)

    results, total = await news_service.search(AsyncMock(), query="", hours=24, limit=30)

    assert len(results) == 4
    assert total == 4


# ── card shaping ───────────────────────────────────────────────────────────────

def test_card_uses_the_stored_heat_when_present():
    row = news_service.FeedRow(
        id=1, source="gdelt", region="CN", language="zh", url=None,
        published_at=datetime(2026, 8, 12, 12, 0, 0), raw_title="标题", raw_summary=None,
        category="macro", title_cn="标题", title_en="Title", summary_cn=None, summary_en=None,
        heat=77.5, signal_type=None, sectors_affected=None, regions=None, theme_tags=None,
        confidence=None, sentiment=None, sig_summary_cn=None, sig_summary_en=None,
    )
    assert news_service._card_from_row(row).heat == 77.5


def test_card_falls_back_to_a_computed_heat_when_none_is_stored():
    row = news_service.FeedRow(
        id=1, source="gdelt", region="CN", language="zh", url=None,
        published_at=datetime(2026, 8, 12, 12, 0, 0), raw_title="标题", raw_summary=None,
        category="macro", title_cn=None, title_en=None, summary_cn=None, summary_en=None,
        heat=None, signal_type=None, sectors_affected=None, regions=None, theme_tags=None,
        confidence=0.9, sentiment=0.5, sig_summary_cn=None, sig_summary_en=None,
    )
    card = news_service._card_from_row(row)
    assert card.heat is not None
    assert 5.0 <= card.heat <= 99.9


def test_compute_heat_falls_as_the_story_ages():
    # `_compute_heat` measures the age against the current UTC clock, so the
    # reference point has to be "now" — not a fixed past date.
    now = datetime.utcnow()
    fresh = news_service._compute_heat(now, confidence=0.9, sentiment=0.8)
    stale = news_service._compute_heat(now - timedelta(days=2), confidence=0.9, sentiment=0.8)
    assert fresh > stale


def test_compute_heat_has_a_floor_and_a_ceiling():
    assert news_service._compute_heat(None, None, None) == 5.0
    assert news_service._compute_heat(datetime.utcnow(), 1.0, 1.0) <= 99.9


# ── range mapping ──────────────────────────────────────────────────────────────

def test_range_to_hours_maps_the_known_ranges():
    assert news_service.range_to_hours("1h") == 1
    assert news_service.range_to_hours("24h") == 24
    assert news_service.range_to_hours("7d") == 24 * 7
    assert news_service.range_to_hours("30d") == 24 * 30


def test_range_to_hours_falls_back_to_the_default_window():
    assert news_service.range_to_hours("nonsense", default=24) == 24
    assert news_service.range_to_hours(None) == news_service.settings.news_default_window_hours


# ── the view-first fetch and its fallback ──────────────────────────────────────

def _result(rows):
    result = MagicMock()
    result.scalars.return_value.all.return_value = rows
    result.all.return_value = rows
    result.scalar_one_or_none.return_value = rows[0] if rows else None
    return result


@pytest.mark.asyncio
async def test_fetch_rows_falls_back_to_the_join_when_the_view_is_missing():
    item = MarketNewsItem(id=1, source="gdelt", title="标题", published_at=datetime(2026, 8, 12, 12, 0, 0))
    meta = CjNewsMeta(id=1, news_item_id=1, category="macro", title_cn="标题", heat=60.0)
    signal = MarketSignal(id=1, news_item_id=1, signal_type="macro")

    db = AsyncMock()
    db.execute.side_effect = [
        Exception('relation "cj_news_feed" does not exist'),
        _result([(item, meta, signal)]),
    ]

    rows = await news_service._fetch_rows(db, hours=24)

    assert len(rows) == 1
    assert rows[0].category == "macro"
    assert rows[0].heat == 60.0
    # The view is marked unavailable so it is not retried on every request.
    assert news_service._view_state["available"] is False
