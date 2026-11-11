"""Read-only mirror of the `cj_*` tables.

These tables are part of the schema contract published in `docs/SCHEMA.sql`. For
CaiJing Today they are strictly read-only — never write or migrate them. Column
definitions mirror the contract; keep them in sync (the schema-drift guard in
`caijing/schema_check.py` will flag divergence).
"""

from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Float,
    Integer,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from caijing.database import Base

_ARGS = {"extend_existing": True}


class CjNewsMeta(Base):
    """caijing presentation sidecar for a market_news_items row (id match, no FK)."""

    __tablename__ = "cj_news_meta"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    news_item_id: Mapped[int] = mapped_column(BigInteger, index=True)
    category: Mapped[Optional[str]] = mapped_column(String)
    title_cn: Mapped[Optional[str]] = mapped_column(Text)
    title_en: Mapped[Optional[str]] = mapped_column(Text)
    summary_cn: Mapped[Optional[str]] = mapped_column(Text)
    summary_en: Mapped[Optional[str]] = mapped_column(Text)
    heat: Mapped[Optional[float]] = mapped_column(Float)  # 0–100
    is_flash: Mapped[Optional[bool]] = mapped_column(Boolean)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjFlash(Base):
    """7×24 newsflash wire (deduped by (source, source_id) upstream)."""

    __tablename__ = "cj_flash"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    published_at: Mapped[datetime] = mapped_column(DateTime)
    text_cn: Mapped[Optional[str]] = mapped_column(Text)
    text_en: Mapped[Optional[str]] = mapped_column(Text)
    source: Mapped[Optional[str]] = mapped_column(String)  # cls | em | sina
    source_id: Mapped[Optional[str]] = mapped_column(String)
    importance: Mapped[Optional[int]] = mapped_column(SmallInteger)
    url: Mapped[Optional[str]] = mapped_column(Text)


class CjMarketQuote(Base):
    """Ticker / global-markets rows and mini-chart sparklines."""

    __tablename__ = "cj_market_quote"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    symbol: Mapped[str] = mapped_column(String)
    name_cn: Mapped[Optional[str]] = mapped_column(String)
    name_en: Mapped[Optional[str]] = mapped_column(String)
    asset_class: Mapped[Optional[str]] = mapped_column(String)  # index|fx|commodity|crypto|rate
    value: Mapped[Optional[str]] = mapped_column(String)        # pre-formatted display string
    change: Mapped[Optional[str]] = mapped_column(String)       # pre-formatted display string
    direction: Mapped[Optional[int]] = mapped_column(SmallInteger)  # 1 up / -1 down
    sparkline: Mapped[Optional[list]] = mapped_column(JSONB)    # 10 floats scaled 0–30
    show_in_ticker: Mapped[Optional[bool]] = mapped_column(Boolean)
    show_in_charts: Mapped[Optional[bool]] = mapped_column(Boolean)
    sort_order: Mapped[Optional[int]] = mapped_column(Integer)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjSectorHeat(Base):
    """Daily sector-heat snapshots (read the latest as_of)."""

    __tablename__ = "cj_sector_heat"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name_cn: Mapped[Optional[str]] = mapped_column(String)
    name_en: Mapped[Optional[str]] = mapped_column(String)
    change_pct: Mapped[Optional[float]] = mapped_column(Float)
    net_inflow: Mapped[Optional[float]] = mapped_column(Float)  # 亿
    region: Mapped[Optional[str]] = mapped_column(String)
    sort_order: Mapped[Optional[int]] = mapped_column(Integer)
    as_of: Mapped[Optional[date]] = mapped_column(Date)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjCryptoCoin(Base):
    __tablename__ = "cj_crypto_coin"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    symbol: Mapped[str] = mapped_column(String)
    name_cn: Mapped[Optional[str]] = mapped_column(String)
    name_en: Mapped[Optional[str]] = mapped_column(String)
    price: Mapped[Optional[str]] = mapped_column(String)
    change_pct: Mapped[Optional[float]] = mapped_column(Float)
    color: Mapped[Optional[str]] = mapped_column(String)
    sort_order: Mapped[Optional[int]] = mapped_column(Integer)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjCryptoChain(Base):
    __tablename__ = "cj_crypto_chain"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name_cn: Mapped[Optional[str]] = mapped_column(String)
    name_en: Mapped[Optional[str]] = mapped_column(String)
    tvl: Mapped[Optional[str]] = mapped_column(String)
    gas: Mapped[Optional[str]] = mapped_column(String)
    change_pct: Mapped[Optional[float]] = mapped_column(Float)
    color: Mapped[Optional[str]] = mapped_column(String)
    sort_order: Mapped[Optional[int]] = mapped_column(Integer)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjCryptoListing(Base):
    __tablename__ = "cj_crypto_listing"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    symbol: Mapped[str] = mapped_column(String)
    venue_cn: Mapped[Optional[str]] = mapped_column(String)
    venue_en: Mapped[Optional[str]] = mapped_column(String)
    listed_date: Mapped[Optional[str]] = mapped_column(String)
    change_pct: Mapped[Optional[float]] = mapped_column(Float)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjMarketMetric(Base):
    """Generic bilingual key/value metrics (crypto_total_cap, fear_greed, …)."""

    __tablename__ = "cj_market_metric"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    metric_key: Mapped[str] = mapped_column(String)
    # `group` is a SQL reserved word — map the attribute to the quoted column.
    group_: Mapped[Optional[str]] = mapped_column("group", String)
    key_cn: Mapped[Optional[str]] = mapped_column(String)
    key_en: Mapped[Optional[str]] = mapped_column(String)
    value_cn: Mapped[Optional[str]] = mapped_column(String)
    value_en: Mapped[Optional[str]] = mapped_column(String)
    direction: Mapped[Optional[int]] = mapped_column(SmallInteger)
    sort_order: Mapped[Optional[int]] = mapped_column(Integer)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjEconEvent(Base):
    __tablename__ = "cj_econ_event"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    event_date: Mapped[date] = mapped_column(Date)
    event_time: Mapped[Optional[str]] = mapped_column(String)
    importance: Mapped[Optional[int]] = mapped_column(SmallInteger)  # 1–3
    name_cn: Mapped[Optional[str]] = mapped_column(String)
    name_en: Mapped[Optional[str]] = mapped_column(String)
    forecast: Mapped[Optional[str]] = mapped_column(String)
    previous: Mapped[Optional[str]] = mapped_column(String)
    actual: Mapped[Optional[str]] = mapped_column(String)
    country: Mapped[Optional[str]] = mapped_column(String)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjTrendingKeyword(Base):
    __tablename__ = "cj_trending_keyword"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    keyword_cn: Mapped[Optional[str]] = mapped_column(String)
    keyword_en: Mapped[Optional[str]] = mapped_column(String)
    rank: Mapped[Optional[int]] = mapped_column(Integer)
    score: Mapped[Optional[float]] = mapped_column(Float)
    as_of: Mapped[Optional[date]] = mapped_column(Date)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjHotStock(Base):
    """Finance hot-ranking (个股热榜) — one snapshot batch per fetch cycle.

    Populated by a data collector, which aggregates external finance hot-lists
    (雪球 人气/热帖, 东方财富 股吧人气榜, 财联社 热门) and/or a native decayed heat
    score into a normalized 0–100 `heat`. The read side takes the latest `as_of`
    snapshot, ordered by `rank`. Until the table exists the read side simply
    returns [] (the panel hides), so shipping it is a no-downtime switch.
    """

    __tablename__ = "cj_hot_stock"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    as_of: Mapped[datetime] = mapped_column(DateTime)          # snapshot batch instant (naive UTC)
    rank: Mapped[Optional[int]] = mapped_column(Integer)
    symbol: Mapped[Optional[str]] = mapped_column(String)      # 600519 | 00700 | AAPL
    name_cn: Mapped[Optional[str]] = mapped_column(String)
    name_en: Mapped[Optional[str]] = mapped_column(String)
    market: Mapped[Optional[str]] = mapped_column(String)      # cn | hk | us
    heat: Mapped[Optional[float]] = mapped_column(Float)       # normalized 0–100
    change_pct: Mapped[Optional[float]] = mapped_column(Float)  # price change %
    price: Mapped[Optional[str]] = mapped_column(String)       # pre-formatted display (optional)
    source: Mapped[Optional[str]] = mapped_column(String)      # xueqiu | eastmoney | cls | blended
    trend: Mapped[Optional[int]] = mapped_column(SmallInteger)  # 1 new / 0 steady / -1 cooling
    url: Mapped[Optional[str]] = mapped_column(Text)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)


class CjNewsFeed(Base):
    """Read-only mirror of the `cj_news_feed` VIEW.

    The view is a flat, presentation-ready join of
    `market_news_items ⨝ cj_news_meta ⨝ market_signals` — it moves the join logic
    out of the API into the schema. Owned/created by the platform migration (DDL in
    docs/CJ_NEWS_FEED_VIEW.sql). caijing reads it; news_service falls back to the
    equivalent in-Python join if the view is not deployed yet.
    """

    __tablename__ = "cj_news_feed"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    source: Mapped[Optional[str]] = mapped_column(String)
    region: Mapped[Optional[str]] = mapped_column(String)
    language: Mapped[Optional[str]] = mapped_column(String)
    url: Mapped[Optional[str]] = mapped_column(Text)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    raw_title: Mapped[Optional[str]] = mapped_column(Text)
    raw_summary: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String)
    title_cn: Mapped[Optional[str]] = mapped_column(Text)
    title_en: Mapped[Optional[str]] = mapped_column(Text)
    summary_cn: Mapped[Optional[str]] = mapped_column(Text)
    summary_en: Mapped[Optional[str]] = mapped_column(Text)
    heat: Mapped[Optional[float]] = mapped_column(Float)
    is_flash: Mapped[Optional[bool]] = mapped_column(Boolean)
    signal_type: Mapped[Optional[str]] = mapped_column(String)
    sectors_affected: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    regions: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    theme_tags: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    sentiment: Mapped[Optional[float]] = mapped_column(Float)
    sig_summary_cn: Mapped[Optional[str]] = mapped_column(Text)
    sig_summary_en: Mapped[Optional[str]] = mapped_column(Text)


class CjEditorialDetail(Base):
    """Read-only mirror of the `cj_editorial_detail` VIEW.

    Full body for a manually-authored editorial item (news/report), keyed by the
    SAME negative-id namespace as `cj_news_feed`'s editorial branch
    (`id = -cj_editorial.id`). `/news/{id}` routes negative ids here for the real
    `body_cn`/`body_en` that the feed view doesn't carry. Owned/created by the
    platform migration (DDL in docs/CJ_NEWS_FEED_VIEW.sql).
    """

    __tablename__ = "cj_editorial_detail"
    __table_args__ = _ARGS

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    kind: Mapped[Optional[str]] = mapped_column(String)
    category: Mapped[Optional[str]] = mapped_column(String)
    title_cn: Mapped[Optional[str]] = mapped_column(String)
    title_en: Mapped[Optional[str]] = mapped_column(String)
    lede_cn: Mapped[Optional[str]] = mapped_column(Text)
    lede_en: Mapped[Optional[str]] = mapped_column(Text)
    body_cn: Mapped[Optional[str]] = mapped_column(Text)
    body_en: Mapped[Optional[str]] = mapped_column(Text)
    hero_image: Mapped[Optional[str]] = mapped_column(Text)
    source_name: Mapped[Optional[str]] = mapped_column(String)
    author_cn: Mapped[Optional[str]] = mapped_column(String)
    author_en: Mapped[Optional[str]] = mapped_column(String)
    url: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    heat: Mapped[Optional[float]] = mapped_column(Float)
    is_featured: Mapped[Optional[bool]] = mapped_column(Boolean)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
