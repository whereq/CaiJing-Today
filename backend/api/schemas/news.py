"""News response schemas.

Every text field is offered bilingually where possible: `*_cn` / `*_en` plus a
convenience `title` (the item's primary language). The frontend picks by the
active locale and falls back to whichever is present.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class CategoryInfo(BaseModel):
    id: str
    cn: str
    en: str
    color: str
    count: int = 0


class NewsCard(BaseModel):
    id: int
    title: str
    title_cn: Optional[str] = None
    title_en: Optional[str] = None
    summary: Optional[str] = None
    summary_cn: Optional[str] = None
    summary_en: Optional[str] = None
    source: str
    source_cn: Optional[str] = None
    source_en: Optional[str] = None
    region: Optional[str] = None
    category: str
    published_at: str
    heat: float
    url: Optional[str] = None


class SearchResponse(BaseModel):
    """Search results plus the TRUE number of matches in the scanned window.

    `total` is the count of every match found, independent of `limit` — the
    frontend states it verbatim instead of inventing a plausible-looking
    number. It is bounded by the feed window the service scans.
    """

    results: list[NewsCard]
    total: int


class ArticleStat(BaseModel):
    key_cn: str
    key_en: str
    value: str
    up: int = 0  # 1 = positive (red/up), -1 = negative (green/down), 0 = neutral


class RelatedItem(BaseModel):
    id: int
    title: str
    title_cn: Optional[str] = None
    title_en: Optional[str] = None
    source: str
    published_at: str


class FlashItem(BaseModel):
    time: str
    text: str
    text_cn: Optional[str] = None
    text_en: Optional[str] = None


class Article(BaseModel):
    id: int
    ref: str  # display id, e.g. "CJ-20481"
    category: str
    title: str
    title_cn: Optional[str] = None
    title_en: Optional[str] = None
    source: str
    author_cn: str
    author_en: str
    published_at: str
    lede_cn: str
    lede_en: str
    body_cn: list[str]
    body_en: list[str]
    stats: list[ArticleStat]
    tags_cn: list[str]
    tags_en: list[str]
    related: list[RelatedItem]
    flash: list[FlashItem]
