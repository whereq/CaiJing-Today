"""Market-panel query service.

Reads the collector-owned `cj_*` market tables and shapes them into the API
schemas. Degrades gracefully: on a DB error it returns the seed fallback when
`SEED_FALLBACK_ENABLED`, else empty. Currently-empty tables (cj_sector_heat,
cj_crypto_listing) simply yield empty lists — the frontend renders nothing.
"""

from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from caijing import seed
from caijing.config import get_settings
from caijing.models import (
    CjCryptoChain,
    CjCryptoCoin,
    CjCryptoListing,
    CjEconEvent,
    CjHotStock,
    CjMarketMetric,
    CjMarketQuote,
    CjSectorHeat,
    CjTrendingKeyword,
)
from api.schemas.market import (
    CalendarEvent,
    Chain,
    Chart,
    Coin,
    CryptoBundle,
    CryptoStat,
    HotStock,
    Keyword,
    NewToken,
    Quote,
    SectorHeat,
)

settings = get_settings()
logger = logging.getLogger(__name__)


async def _rows(db: AsyncSession, stmt):
    """Execute a scalars() query, returning [] on any DB error."""
    try:
        result = await db.execute(stmt)
        return list(result.scalars().all())
    except Exception as exc:  # noqa: BLE001 - degrade gracefully
        logger.warning("market query failed: %s", exc)
        return None  # signals "DB unavailable" (vs. [] = "reachable but empty")


def _seed_ok() -> bool:
    return settings.seed_fallback_enabled


async def get_quotes(db: AsyncSession) -> list[Quote]:
    rows = await _rows(
        db,
        select(CjMarketQuote)
        .where(CjMarketQuote.show_in_ticker.is_(True))
        .order_by(CjMarketQuote.sort_order),
    )
    if rows is None:
        return [Quote(name_cn=q[0], name_en=q[1], value=q[2], change=q[3], direction=q[4]) for q in seed.QUOTES] if _seed_ok() else []
    return [
        Quote(name_cn=r.name_cn or "", name_en=r.name_en or "", value=r.value or "", change=r.change or "", direction=r.direction or 0)
        for r in rows
    ]


async def get_charts(db: AsyncSession) -> list[Chart]:
    rows = await _rows(
        db,
        select(CjMarketQuote)
        .where(CjMarketQuote.show_in_charts.is_(True))
        .order_by(CjMarketQuote.sort_order),
    )
    if rows is None:
        return [Chart(name_cn=c[0], name_en=c[1], value=c[2], change=c[3], direction=c[4], points=[float(p) for p in c[5]]) for c in seed.CHARTS] if _seed_ok() else []
    return [
        Chart(
            name_cn=r.name_cn or "", name_en=r.name_en or "", value=r.value or "",
            change=r.change or "", direction=r.direction or 0,
            points=[float(p) for p in (r.sparkline or [])],
        )
        for r in rows
    ]


async def get_sectors(db: AsyncSession) -> list[SectorHeat]:
    # Latest snapshot only (daily as_of accumulates).
    try:
        latest = (await db.execute(select(func.max(CjSectorHeat.as_of)))).scalar_one_or_none()
    except Exception as exc:  # noqa: BLE001
        logger.warning("sector max(as_of) query failed: %s", exc)
        return [SectorHeat(name_cn=s[0], name_en=s[1], change_pct=s[2], inflow=s[3]) for s in seed.SECTORS] if _seed_ok() else []
    if latest is None:
        return []  # reachable but no snapshots yet — degrade to nothing
    rows = await _rows(
        db,
        select(CjSectorHeat).where(CjSectorHeat.as_of == latest).order_by(CjSectorHeat.sort_order),
    )
    if rows is None:
        return []
    return [
        SectorHeat(name_cn=r.name_cn or "", name_en=r.name_en or "", change_pct=r.change_pct or 0.0, inflow=r.net_inflow or 0.0)
        for r in rows
    ]


async def get_crypto(db: AsyncSession) -> CryptoBundle:
    coins = await _rows(db, select(CjCryptoCoin).order_by(CjCryptoCoin.sort_order))
    chains = await _rows(db, select(CjCryptoChain).order_by(CjCryptoChain.sort_order))
    listings = await _rows(db, select(CjCryptoListing).order_by(CjCryptoListing.listed_date.desc()))
    metrics = await _rows(
        db,
        select(CjMarketMetric).where(CjMarketMetric.group_ == "crypto").order_by(CjMarketMetric.sort_order),
    )

    if coins is None and chains is None and metrics is None:
        if _seed_ok():
            return CryptoBundle(
                coins=[Coin(symbol=c[0], name_cn=c[1], name_en=c[2], price=c[3], change_pct=c[4], color=c[5]) for c in seed.COINS],
                stats=[CryptoStat(key_cn=s[0], key_en=s[1], value_cn=s[2], value_en=s[3], up=s[4]) for s in seed.CRYPTO_STATS],
                chains=[Chain(name_en=c[0], name_cn=c[1], tvl=c[2], gas=c[3], change_pct=c[4], color=c[5]) for c in seed.CHAINS],
                new_tokens=[NewToken(symbol=n[0], venue_cn=n[1], venue_en=n[2], date=n[3], change_pct=n[4]) for n in seed.NEW_TOKENS],
            )
        return CryptoBundle(coins=[], stats=[], chains=[], new_tokens=[])

    return CryptoBundle(
        coins=[
            Coin(symbol=r.symbol, name_cn=r.name_cn or "", name_en=r.name_en or "", price=r.price or "", change_pct=r.change_pct or 0.0, color=r.color or "#888888")
            for r in (coins or [])
        ],
        stats=[
            CryptoStat(key_cn=r.key_cn or "", key_en=r.key_en or "", value_cn=r.value_cn or "", value_en=r.value_en or "", up=1 if (r.direction or 0) > 0 else 0)
            for r in (metrics or [])
        ],
        chains=[
            Chain(name_cn=r.name_cn or "", name_en=r.name_en or "", tvl=r.tvl or "", gas=r.gas or "", change_pct=r.change_pct or 0.0, color=r.color or "#888888")
            for r in (chains or [])
        ],
        new_tokens=[
            NewToken(symbol=r.symbol, venue_cn=r.venue_cn or "", venue_en=r.venue_en or "", date=r.listed_date or "", change_pct=r.change_pct or 0.0)
            for r in (listings or [])
        ],
    )


async def get_calendar(db: AsyncSession) -> list[CalendarEvent]:
    from datetime import date, timedelta

    today = date.today()
    rows = await _rows(
        db,
        select(CjEconEvent)
        .where(CjEconEvent.event_date >= today, CjEconEvent.event_date <= today + timedelta(days=2))
        .order_by(CjEconEvent.event_date, CjEconEvent.event_time),
    )
    if rows is None:
        return [CalendarEvent(time=e[0], importance=e[1], name_cn=e[2], name_en=e[3], forecast=e[4]) for e in seed.CALENDAR] if _seed_ok() else []
    return [
        CalendarEvent(
            time=r.event_time or "", importance=r.importance or 1,
            name_cn=r.name_cn or "", name_en=r.name_en or "", forecast=r.forecast or "—",
        )
        for r in rows
    ]


async def get_keywords(db: AsyncSession) -> list[Keyword]:
    try:
        latest = (await db.execute(select(func.max(CjTrendingKeyword.as_of)))).scalar_one_or_none()
    except Exception as exc:  # noqa: BLE001
        logger.warning("keyword max(as_of) query failed: %s", exc)
        return [Keyword(cn=k[0], en=k[1]) for k in seed.KEYWORDS] if _seed_ok() else []
    if latest is None:
        return []
    rows = await _rows(
        db,
        select(CjTrendingKeyword).where(CjTrendingKeyword.as_of == latest).order_by(CjTrendingKeyword.rank),
    )
    if rows is None:
        return []
    return [Keyword(cn=r.keyword_cn or "", en=r.keyword_en or "") for r in rows]


async def get_hot_stocks(db: AsyncSession, limit: int = 50) -> list[HotStock]:
    """Finance 热榜: the latest snapshot batch, ranked. Empty until the collector
    deploys `cj_hot_stock` (missing table → DB error → [] → the panel hides)."""
    try:
        latest = (await db.execute(select(func.max(CjHotStock.as_of)))).scalar_one_or_none()
    except Exception as exc:  # noqa: BLE001 - table not deployed yet / DB down
        logger.warning("hot-stock max(as_of) query failed: %s", exc)
        return []
    if latest is None:
        return []  # reachable but no snapshot yet — render nothing
    rows = await _rows(
        db,
        select(CjHotStock).where(CjHotStock.as_of == latest).order_by(CjHotStock.rank).limit(limit),
    )
    if rows is None:
        return []
    return [
        HotStock(
            rank=r.rank or 0, symbol=r.symbol or "", name_cn=r.name_cn or "", name_en=r.name_en or "",
            market=r.market or "", heat=r.heat or 0.0, change_pct=r.change_pct or 0.0,
            trend=r.trend or 0, url=r.url,
        )
        for r in rows
    ]
