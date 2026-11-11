"""Market Intelligence models — READ-ONLY mirror of the published schema.

These tables are part of the schema contract published in `docs/SCHEMA.sql`. For
CaiJing Today they are strictly read-only — never write or migrate them. Column
definitions mirror the contract; keep them in sync (the schema-drift guard in
`caijing/schema_check.py` will flag divergence).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from caijing.database import Base


class MarketNewsItem(Base):
    """Raw news article/event fetched from an external source (deduped by source+source_id)."""

    __tablename__ = "market_news_items"
    __table_args__ = (
        UniqueConstraint("source", "source_id", name="uq_news_source_id"),
        Index("ix_news_published_at", "published_at"),
        Index("ix_news_is_processed", "is_processed", "published_at"),
        {"extend_existing": True},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[Optional[str]] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    url: Mapped[Optional[str]] = mapped_column(Text)
    published_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    region: Mapped[Optional[str]] = mapped_column(String(10))
    language: Mapped[str] = mapped_column(String(5), default="en")
    raw_sentiment: Mapped[Optional[float]] = mapped_column(Float)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MarketSignal(Base):
    """AI-processed intelligence signal derived from a MarketNewsItem (one per item)."""

    __tablename__ = "market_signals"
    __table_args__ = (
        UniqueConstraint("news_item_id", name="uq_signal_news_item"),
        Index("ix_signal_processed_at", "processed_at"),
        {"extend_existing": True},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    news_item_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    signal_type: Mapped[str] = mapped_column(String(30), nullable=False)
    sentiment: Mapped[Optional[float]] = mapped_column(Float)
    confidence: Mapped[Optional[float]] = mapped_column(Float)
    impact_horizon: Mapped[Optional[str]] = mapped_column(String(10))
    regions: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(10)))
    sectors_affected: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(50)))
    symbols_mentioned: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(20)))
    symbols_impacted: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(20)))
    impact_direction: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(10)))
    theme_tags: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(100)))
    summary_en: Mapped[Optional[str]] = mapped_column(Text)
    summary_zh: Mapped[Optional[str]] = mapped_column(Text)
    processed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    model_used: Mapped[Optional[str]] = mapped_column(String(50))


class SectorIntelligence(Base):
    """Daily aggregated intelligence for one sector/region pair."""

    __tablename__ = "sector_intelligence"
    __table_args__ = (
        UniqueConstraint("sector", "region", "intel_date", name="uq_sector_intel_date"),
        Index("ix_sector_intel_date", "intel_date"),
        {"extend_existing": True},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    sector: Mapped[str] = mapped_column(String(50), nullable=False)
    region: Mapped[str] = mapped_column(String(10), nullable=False)
    intel_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    signal_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_sentiment: Mapped[Optional[float]] = mapped_column(Float)
    bullish_count: Mapped[int] = mapped_column(Integer, default=0)
    bearish_count: Mapped[int] = mapped_column(Integer, default=0)
    top_themes: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String(100)))
    narrative: Mapped[Optional[str]] = mapped_column(Text)
    key_signal_ids: Mapped[Optional[list[int]]] = mapped_column(ARRAY(BigInteger))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
