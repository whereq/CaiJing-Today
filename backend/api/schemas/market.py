"""Market panel response schemas (quotes, sectors, crypto, calendar, keywords)."""

from __future__ import annotations

from pydantic import BaseModel


class Quote(BaseModel):
    name_cn: str
    name_en: str
    value: str
    change: str
    direction: int  # 1 up / -1 down


class Chart(BaseModel):
    name_cn: str
    name_en: str
    value: str
    change: str
    direction: int
    points: list[float]


class SectorHeat(BaseModel):
    name_cn: str
    name_en: str
    change_pct: float
    inflow: float  # net inflow, 亿 (hundred million)


class Coin(BaseModel):
    symbol: str
    name_cn: str
    name_en: str
    price: str
    change_pct: float
    color: str


class Chain(BaseModel):
    name_cn: str
    name_en: str
    tvl: str
    gas: str
    change_pct: float
    color: str


class NewToken(BaseModel):
    symbol: str
    venue_cn: str
    venue_en: str
    date: str
    change_pct: float


class CryptoStat(BaseModel):
    key_cn: str
    key_en: str
    value_cn: str
    value_en: str
    up: int


class CryptoBundle(BaseModel):
    coins: list[Coin]
    stats: list[CryptoStat]
    chains: list[Chain]
    new_tokens: list[NewToken]


class CalendarEvent(BaseModel):
    time: str
    importance: int  # 1-3 stars
    name_cn: str
    name_en: str
    forecast: str


class Keyword(BaseModel):
    cn: str
    en: str


class HotStock(BaseModel):
    rank: int
    symbol: str
    name_cn: str
    name_en: str
    market: str  # cn | hk | us
    heat: float  # normalized 0–100
    change_pct: float
    trend: int  # 1 new / 0 steady / -1 cooling
    url: str | None = None


class SourceInfo(BaseModel):
    name_cn: str
    name_en: str
    region: str
