"""News query + shaping service.

Reads the shared `market_news_items` / `market_signals` tables, derives a caijing
category per item, computes a display "heat" score, and shapes rows into the API
response models. When the shared table is empty (fresh dev DB) it falls back to
the bundled sample dataset so the frontend renders a full page.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from caijing import seed
from caijing.config import get_settings
from caijing.models import (
    CjEditorialDetail,
    CjFlash,
    CjNewsFeed,
    CjNewsMeta,
    MarketNewsItem,
    MarketSignal,
)
from caijing.taxonomy import CATEGORY_IDS, classify
from caijing.timeutil import hhmm_utc, iso_utc
from api.schemas.news import (
    Article,
    ArticleStat,
    FlashItem,
    NewsCard,
    RelatedItem,
)

settings = get_settings()
logger = logging.getLogger(__name__)

_SAMPLE_SUMMARY_CN = (
    "据接近监管的人士表示，相关安排仍在讨论中，具体细则将于近期公布。"
    "市场普遍预期政策落地节奏将快于前次。"
)
_SAMPLE_SUMMARY_EN = (
    "People close to the regulator say the arrangements remain under discussion, "
    "with details expected shortly."
)

_SAMPLE_BODY_CN = [
    "央行在公开市场业务交易公告中表示，为维护银行体系流动性合理充裕，当日以利率招标方式开展逆回购操作，操作规模与到期量基本匹配。分析人士认为，这一安排延续了近月来的稳健取向。",
    "多家券商固收团队在当日发布的点评中提到，短端资金面的宽松已较为充分反映在价格中，后续更值得关注的是中长端的配置需求，尤其是保险与理财资金在年末的行为变化。",
    "从行业维度看，本轮资金流入集中在电子、电力设备与非银金融三个方向。有基金经理表示，仓位调整更多基于明年一季度的盈利预期，而非短期的政策交易。",
    "不过也有机构持谨慎态度。一位私募投资总监指出，当前估值修复已经消化了大部分乐观情形，若后续盈利端的验证不及预期，市场可能出现震荡。",
    "统计数据显示，年内北向资金累计净买入规模已超过去年同期，行业分布较为均衡。政策层面，相关部门近期多次提及要提高直接融资比重，改善市场中长期资金供给结构。",
]
_SAMPLE_BODY_EN = [
    "The central bank said in its open-market statement that it conducted reverse repurchase operations at a rate tender to keep banking-system liquidity ample, with the size broadly matching maturing volumes. Analysts read the move as a continuation of recent months' steady stance.",
    "Fixed-income desks at several brokerages wrote that easy short-end conditions are largely priced in, and that allocation demand at the long end matters more from here, particularly year-end behaviour from insurers and wealth-management funds.",
    "By sector, inflows concentrated in electronics, power equipment and non-bank financials. One portfolio manager said the rotation reflects first-quarter earnings expectations rather than a short-term policy trade.",
    "Others were more cautious. A private-fund investment director argued that the valuation recovery already embeds most of the optimistic case, leaving room for volatility if earnings disappoint.",
    "Northbound purchases so far this year exceed the same period in the prior year, spread fairly evenly across sectors. Officials have repeatedly said they want a larger share of direct financing and a better supply of long-term capital.",
]
_SAMPLE_TAGS_CN = ["货币政策", "流动性", "债券市场", "A股", "资产配置"]
_SAMPLE_TAGS_EN = ["Monetary policy", "Liquidity", "Bond market", "A-shares", "Allocation"]

_SAMPLE_ID_BASE = 20481  # matches the design's "CJ-<n>" reference ids

_RANGE_HOURS = {"1h": 1, "24h": 24, "7d": 24 * 7, "30d": 24 * 30}


def range_to_hours(range_key: Optional[str], default: Optional[int] = None) -> int:
    if range_key and range_key in _RANGE_HOURS:
        return _RANGE_HOURS[range_key]
    return default or settings.news_default_window_hours


def _compute_heat(
    published_at: Optional[datetime], confidence: Optional[float], sentiment: Optional[float]
) -> float:
    if published_at is None:
        return 5.0
    age_h = max(0.0, (datetime.utcnow() - published_at).total_seconds() / 3600)
    base = 50 + (confidence or 0.5) * 40 + abs(sentiment or 0.0) * 10 - age_h * 0.4
    return round(min(99.9, max(5.0, base)), 1)


# ── Flat feed row ──────────────────────────────────────────────────────────────
# One shape consumed by the card/article builders, produced either by the
# cj_news_feed VIEW (preferred) or the equivalent in-Python join (fallback).

@dataclass
class FeedRow:
    id: int
    source: Optional[str]
    region: Optional[str]
    language: Optional[str]
    url: Optional[str]
    published_at: Optional[datetime]
    raw_title: Optional[str]
    raw_summary: Optional[str]
    category: Optional[str]
    title_cn: Optional[str]
    title_en: Optional[str]
    summary_cn: Optional[str]
    summary_en: Optional[str]
    heat: Optional[float]
    signal_type: Optional[str]
    sectors_affected: Optional[list]
    regions: Optional[list]
    theme_tags: Optional[list]
    confidence: Optional[float]
    sentiment: Optional[float]
    sig_summary_cn: Optional[str]
    sig_summary_en: Optional[str]

    @classmethod
    def from_view(cls, v: CjNewsFeed) -> "FeedRow":
        return cls(
            id=v.id, source=v.source, region=v.region, language=v.language, url=v.url,
            published_at=v.published_at, raw_title=v.raw_title, raw_summary=v.raw_summary,
            category=v.category, title_cn=v.title_cn, title_en=v.title_en,
            summary_cn=v.summary_cn, summary_en=v.summary_en, heat=v.heat,
            signal_type=v.signal_type, sectors_affected=v.sectors_affected, regions=v.regions,
            theme_tags=v.theme_tags, confidence=v.confidence, sentiment=v.sentiment,
            sig_summary_cn=v.sig_summary_cn, sig_summary_en=v.sig_summary_en,
        )

    @classmethod
    def from_join(cls, item: MarketNewsItem, meta: Optional[CjNewsMeta], sig: Optional[MarketSignal]) -> "FeedRow":
        return cls(
            id=item.id, source=item.source, region=item.region, language=item.language, url=item.url,
            published_at=item.published_at, raw_title=item.title, raw_summary=item.summary,
            category=meta.category if meta else None,
            title_cn=meta.title_cn if meta else None, title_en=meta.title_en if meta else None,
            summary_cn=meta.summary_cn if meta else None, summary_en=meta.summary_en if meta else None,
            heat=meta.heat if meta else None,
            signal_type=sig.signal_type if sig else None,
            sectors_affected=sig.sectors_affected if sig else None,
            regions=sig.regions if sig else None,
            theme_tags=sig.theme_tags if sig else None,
            confidence=sig.confidence if sig else None,
            sentiment=sig.sentiment if sig else None,
            sig_summary_cn=sig.summary_zh if sig else None,
            sig_summary_en=sig.summary_en if sig else None,
        )


def _card_from_row(r: FeedRow) -> NewsCard:
    # Category + bilingual text + heat come from cj_news_meta (via the view / join)
    # when present; classify()/compute are the fallback for any untagged row.
    if r.category:
        cat = r.category
    else:
        cat = classify(
            signal_type=r.signal_type,
            sectors_affected=r.sectors_affected,
            regions=r.regions or ([r.region] if r.region else None),
            theme_tags=r.theme_tags,
            title=r.raw_title or "",
            language=r.language or "en",
        )
    is_cn = (r.language or "en").startswith("zh")
    title_cn = r.title_cn or (r.raw_title if is_cn else r.sig_summary_cn)
    title_en = r.title_en or (r.raw_title if not is_cn else r.sig_summary_en)
    summary_cn = r.summary_cn or r.sig_summary_cn or (r.raw_summary if is_cn else None)
    summary_en = r.summary_en or r.sig_summary_en or (r.raw_summary if not is_cn else None)
    heat = r.heat if r.heat is not None else _compute_heat(r.published_at, r.confidence, r.sentiment)
    return NewsCard(
        id=r.id,
        title=r.raw_title or "",
        title_cn=title_cn,
        title_en=title_en,
        summary=r.raw_summary,
        summary_cn=summary_cn,
        summary_en=summary_en,
        source=r.source or "",
        source_cn=None,
        source_en=None,
        region=r.region,
        category=cat,
        published_at=iso_utc(r.published_at),
        heat=heat,
        url=r.url,
    )


# ── Feed fetch: cj_news_feed VIEW first, in-Python join fallback ─────────────────
# The view moves the join into the schema. If it isn't deployed yet, we detect the
# missing-relation error, flip to the join, and re-probe every 5 min so a
# freshly-created view is picked up without a restart.

_view_state: dict = {"available": None, "checked_at": 0.0}
_VIEW_REPROBE_SECONDS = 300


def _should_try_view() -> bool:
    st = _view_state
    if st["available"] is None or st["available"] is True:
        return True
    return (time.monotonic() - st["checked_at"]) >= _VIEW_REPROBE_SECONDS


def _note_view_error(exc: Exception) -> None:
    msg = str(exc).lower()
    if "cj_news_feed" in msg or "does not exist" in msg or "undefinedtable" in msg:
        _view_state["available"] = False
        _view_state["checked_at"] = time.monotonic()
        logger.info("cj_news_feed view not deployed; using in-Python join fallback")
    else:  # transient (e.g. DB down) — don't disable the view path
        logger.warning("cj_news_feed query failed (transient): %s", exc)


async def _fetch_rows(db: AsyncSession, *, hours: int, cap: int = 500) -> list[FeedRow]:
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    if _should_try_view():
        try:
            result = await db.execute(
                select(CjNewsFeed)
                .where(CjNewsFeed.published_at >= cutoff)
                .order_by(CjNewsFeed.published_at.desc())
                .limit(cap)
            )
            _view_state["available"] = True
            return [FeedRow.from_view(v) for v in result.scalars().all()]
        except Exception as exc:  # noqa: BLE001
            _note_view_error(exc)
    try:
        result = await db.execute(
            select(MarketNewsItem, CjNewsMeta, MarketSignal)
            .outerjoin(CjNewsMeta, CjNewsMeta.news_item_id == MarketNewsItem.id)
            .outerjoin(MarketSignal, MarketSignal.news_item_id == MarketNewsItem.id)
            .where(MarketNewsItem.published_at >= cutoff)
            .order_by(MarketNewsItem.published_at.desc())
            .limit(cap)
        )
        return [FeedRow.from_join(i, m, s) for i, m, s in result.all()]
    except Exception as exc:  # noqa: BLE001 - degrade to seed fallback
        logger.warning("news query failed, falling back to seed: %s", exc)
        return []


async def _fetch_one(db: AsyncSession, article_id: int) -> Optional[FeedRow]:
    if _should_try_view():
        try:
            result = await db.execute(select(CjNewsFeed).where(CjNewsFeed.id == article_id))
            _view_state["available"] = True
            v = result.scalar_one_or_none()
            return FeedRow.from_view(v) if v else None
        except Exception as exc:  # noqa: BLE001
            _note_view_error(exc)
    try:
        result = await db.execute(
            select(MarketNewsItem, CjNewsMeta, MarketSignal)
            .outerjoin(CjNewsMeta, CjNewsMeta.news_item_id == MarketNewsItem.id)
            .outerjoin(MarketSignal, MarketSignal.news_item_id == MarketNewsItem.id)
            .where(MarketNewsItem.id == article_id)
        )
        row = result.first()
        return FeedRow.from_join(*row) if row else None
    except Exception as exc:  # noqa: BLE001
        logger.warning("article query failed: %s", exc)
        return None


# ── Sample fallback (mirrors the design's item() generator) ─────────────────────

def _sample_card(i: int, idx: int) -> NewsCard:
    cn, en, cat = seed.SAMPLE_HEADLINES[i % len(seed.SAMPLE_HEADLINES)]
    src = seed.SOURCES[(i * 5 + idx) % len(seed.SOURCES)]
    mins = 3 + ((i * 13 + idx * 7) % 220)
    heat = round(max(8.0, 100 - idx * 1.9 - (i % 5) * 3), 1)
    published_at = datetime.utcnow() - timedelta(minutes=mins)
    return NewsCard(
        id=_SAMPLE_ID_BASE + i,
        title=cn,
        title_cn=cn,
        title_en=en,
        summary=_SAMPLE_SUMMARY_CN,
        summary_cn=_SAMPLE_SUMMARY_CN,
        summary_en=_SAMPLE_SUMMARY_EN,
        source=src[0],
        source_cn=src[0],
        source_en=src[1],
        region=src[2],
        category=cat,
        published_at=iso_utc(published_at),
        heat=heat,
        url=None,
    )


def _sample_cards(count: int) -> list[NewsCard]:
    return [_sample_card(i, i) for i in range(count)]


# ── Public API ─────────────────────────────────────────────────────────────────

async def get_cards(
    db: AsyncSession,
    *,
    hours: int,
    category: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[NewsCard]:
    """Return news cards (newest first), optionally filtered by category/source."""
    rows = await _fetch_rows(db, hours=hours)
    cards = [_card_from_row(r) for r in rows]

    if not cards and settings.seed_fallback_enabled:
        cards = _sample_cards(60)

    if category:
        cards = [c for c in cards if c.category == category]
    if source:
        cards = [c for c in cards if source in (c.source, c.source_en, c.source_cn)]

    return cards[offset : offset + limit]


async def get_hot(db: AsyncSession, *, hours: int, limit: int = 50) -> list[NewsCard]:
    """Return the hottest cards in the window, ranked by heat."""
    cards = await get_cards(db, hours=hours, limit=1000)
    cards.sort(key=lambda c: c.heat, reverse=True)
    return cards[:limit]


async def search(db: AsyncSession, *, query: str, hours: int, limit: int = 30) -> tuple[list[NewsCard], int]:
    """Return `(results, total_matches)` for a free-text query.

    `total_matches` counts EVERY match found in the scanned window and is not
    capped by `limit`, so the API can report the real number of hits instead of
    leaving the UI to guess one.
    """
    cards = await get_cards(db, hours=hours, limit=1000)
    if not query:
        return cards[:limit], len(cards)
    q = query.lower()

    def match(c: NewsCard) -> bool:
        return any(
            q in (v or "").lower()
            for v in (c.title, c.title_cn, c.title_en, c.summary_cn, c.summary_en)
        )

    matched = [c for c in cards if match(c)]
    return matched[:limit], len(matched)


async def get_boards(db: AsyncSession, *, hours: int, per_board: int = 5) -> dict[str, list[NewsCard]]:
    """Group the window's cards by category (ordered by the taxonomy)."""
    cards = await get_cards(db, hours=hours, limit=1000)
    boards: dict[str, list[NewsCard]] = {cid: [] for cid in CATEGORY_IDS}
    for c in cards:
        if c.category in boards and len(boards[c.category]) < per_board:
            boards[c.category].append(c)
    # Ensure every board has content in seed mode by topping up from samples.
    if settings.seed_fallback_enabled:
        for pos, cid in enumerate(CATEGORY_IDS):
            j = 0
            while len(boards[cid]) < per_board:
                sc = _sample_card(pos * 2 + j, j)
                sc.category = cid
                boards[cid].append(sc)
                j += 1
    return boards


async def category_counts(db: AsyncSession, *, hours: int) -> dict[str, int]:
    cards = await get_cards(db, hours=hours, limit=2000)
    counts = {cid: 0 for cid in CATEGORY_IDS}
    for c in cards:
        counts[c.category] = counts.get(c.category, 0) + 1
    return counts


def _sample_article(index: int) -> Article:
    card = _sample_card(index, 0)
    return Article(
        id=card.id,
        ref=f"CJ-{card.id}",
        category=card.category,
        title=card.title,
        title_cn=card.title_cn,
        title_en=card.title_en,
        source=card.source,
        author_cn="记者 林卓 / 编辑 沈述",
        author_en="By Lin Zhuo · Edited by Shen Shu",
        published_at=card.published_at,
        lede_cn="政策落地节奏快于市场预期，短端利率随之下行；机构普遍上调对四季度社融增速的判断，但对信贷需求的持续性仍有分歧。",
        lede_en="The measures landed faster than expected, pulling short-end rates lower. Analysts raised fourth-quarter credit forecasts while disagreeing on the durability of loan demand.",
        body_cn=_SAMPLE_BODY_CN,
        body_en=_SAMPLE_BODY_EN,
        stats=[
            ArticleStat(key_cn="涉及指数", key_en="INDEX", value="3,418.62", up=1),
            ArticleStat(key_cn="日内变动", key_en="CHANGE", value="+1.24%", up=1),
            ArticleStat(key_cn="成交额", key_en="TURNOVER", value="1.21万亿", up=0),
            ArticleStat(key_cn="关注度", key_en="HEAT", value=f"{card.heat}w", up=0),
        ],
        tags_cn=_SAMPLE_TAGS_CN,
        tags_en=_SAMPLE_TAGS_EN,
        related=[
            RelatedItem(id=r.id, title=r.title, title_cn=r.title_cn, title_en=r.title_en, source=r.source, published_at=r.published_at)
            for r in [_sample_card(index + k + 1, k) for k in range(6)]
        ],
        flash=[FlashItem(time=f[0], text=f[1], text_cn=f[1], text_en=f[2]) for f in seed.SAMPLE_FLASH[:5]],
    )


async def _get_editorial_article(db: AsyncSession, article_id: int) -> Optional[Article]:
    """Manually-authored content (cj_editorial), addressed by a negative id.

    Reads cj_editorial_detail directly rather than the feed view/FeedRow: the
    detail view already carries everything an Article needs (real body, author,
    category) and editorial rows are pre-tagged with a valid taxonomy id, so no
    classify() fallback is needed.
    """
    try:
        result = await db.execute(select(CjEditorialDetail).where(CjEditorialDetail.id == article_id))
        e = result.scalar_one_or_none()
    except Exception as exc:  # noqa: BLE001
        logger.warning("editorial detail query failed: %s", exc)
        return None
    if e is None:
        return None

    def _paragraphs(text: Optional[str]) -> list[str]:
        return [p.strip() for p in (text or "").split("\n") if p.strip()]

    tags = e.tags or []
    related_cards = await get_cards(db, hours=24 * 30, category=e.category, limit=6)
    related = [
        RelatedItem(id=c.id, title=c.title, title_cn=c.title_cn, title_en=c.title_en, source=c.source, published_at=c.published_at)
        for c in related_cards
        if c.id != e.id
    ][:6]
    flash = await get_flash(db, limit=5)

    return Article(
        id=e.id,
        ref=f"CJ-{e.id}",
        category=e.category or "macro",
        title=e.title_cn or e.title_en or "",
        title_cn=e.title_cn,
        title_en=e.title_en,
        source=e.source_name or "财经今日",
        author_cn=e.author_cn or "财经今日 编辑部",
        author_en=e.author_en or "Caijing Today Editorial",
        published_at=iso_utc(e.published_at),
        lede_cn=e.lede_cn or "",
        lede_en=e.lede_en or "",
        body_cn=_paragraphs(e.body_cn),
        body_en=_paragraphs(e.body_en),
        stats=[],
        tags_cn=tags,
        tags_en=tags,
        related=related,
        flash=flash,
    )


async def get_article(db: AsyncSession, article_id: int) -> Optional[Article]:
    """Return a full article by id. Falls back to a sample article for seed ids."""
    if article_id < 0:
        return await _get_editorial_article(db, article_id)

    row = await _fetch_one(db, article_id)

    if row is None:
        if settings.seed_fallback_enabled and article_id >= _SAMPLE_ID_BASE:
            idx = article_id - _SAMPLE_ID_BASE
            if 0 <= idx < len(seed.SAMPLE_HEADLINES):
                return _sample_article(idx)
        return None

    card = _card_from_row(row)
    is_cn = (row.language or "en").startswith("zh")
    body_src = row.raw_summary or row.raw_title
    paragraphs = [p.strip() for p in (body_src or "").split("\n") if p.strip()] or [body_src or ""]

    # Related: other recent items in the same category.
    related_cards = await get_cards(db, hours=24 * 30, category=card.category, limit=6)
    related = [
        RelatedItem(
            id=c.id, title=c.title, title_cn=c.title_cn, title_en=c.title_en,
            source=c.source, published_at=c.published_at,
        )
        for c in related_cards
        if c.id != row.id
    ][:6]

    tags = row.theme_tags or []
    flash = await get_flash(db, limit=5)

    return Article(
        id=row.id,
        ref=f"CJ-{row.id}",
        category=card.category,
        title=row.raw_title or "",
        title_cn=card.title_cn,
        title_en=card.title_en,
        source=row.source or "",
        author_cn="财经今日 综合",
        author_en="Caijing Today Staff",
        published_at=iso_utc(row.published_at),
        lede_cn=card.summary_cn or (row.raw_summary if is_cn else "") or "",
        lede_en=card.summary_en or (row.raw_summary if not is_cn else "") or "",
        body_cn=paragraphs if is_cn else [],
        body_en=paragraphs if not is_cn else [],
        stats=[],
        tags_cn=tags,
        tags_en=tags,
        related=related,
        flash=flash,
    )


# ── Flash (7×24 newswire) ───────────────────────────────────────────────────────

async def get_flash(db: AsyncSession, *, limit: int = 10) -> list[FlashItem]:
    """Return the latest flash items from cj_flash (newest first)."""
    try:
        result = await db.execute(
            select(CjFlash).order_by(CjFlash.published_at.desc()).limit(limit)
        )
        rows = list(result.scalars().all())
    except Exception as exc:  # noqa: BLE001
        logger.warning("flash query failed: %s", exc)
        rows = []

    if not rows:
        if settings.seed_fallback_enabled:
            return [
                FlashItem(time=f[0], text=f[1], text_cn=f[1], text_en=f[2])
                for f in seed.SAMPLE_FLASH[:limit]
            ]
        return []

    return [
        FlashItem(
            time=hhmm_utc(r.published_at),
            text=(r.text_cn or r.text_en or ""),
            text_cn=r.text_cn,
            text_en=r.text_en,
        )
        for r in rows
    ]
