"""News endpoints (public — browsing does not require auth).

GET /news/hot                 — TOP ranked headlines by heat
GET /news/latest              — newest cards (optionally by category/source)
GET /news/category/{cat}      — cards for one category
GET /news/boards              — cards grouped by category (home "Category Boards")
GET /news/flash               — 7×24 live newsflash
GET /news/{id}                — full article + related + flash
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from caijing import news_service
from caijing.database import get_db
from caijing.taxonomy import CATEGORY_IDS
from api.schemas.news import Article, FlashItem, NewsCard

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/hot", response_model=list[NewsCard])
async def hot(
    range: str = Query(default="24h", description="1h | 24h | 7d | 30d"),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    hours = news_service.range_to_hours(range)
    return await news_service.get_hot(db, hours=hours, limit=limit)


@router.get("/latest", response_model=list[NewsCard])
async def latest(
    range: str = Query(default="24h"),
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    hours = news_service.range_to_hours(range)
    return await news_service.get_cards(
        db, hours=hours, category=category, source=source, limit=limit, offset=offset
    )


@router.get("/category/{cat}", response_model=list[NewsCard])
async def by_category(
    cat: str = Path(...),
    range: str = Query(default="24h"),
    source: Optional[str] = Query(default=None),
    limit: int = Query(default=30, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    if cat not in CATEGORY_IDS:
        raise HTTPException(status_code=404, detail=f"Unknown category '{cat}'")
    hours = news_service.range_to_hours(range)
    return await news_service.get_cards(
        db, hours=hours, category=cat, source=source, limit=limit, offset=offset
    )


@router.get("/boards", response_model=dict[str, list[NewsCard]])
async def boards(
    range: str = Query(default="24h"),
    per_board: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    hours = news_service.range_to_hours(range)
    return await news_service.get_boards(db, hours=hours, per_board=per_board)


@router.get("/flash", response_model=list[FlashItem])
async def flash(
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Live 7×24 newsflash from cj_flash (newest first)."""
    return await news_service.get_flash(db, limit=limit)


@router.get("/{article_id}", response_model=Article)
async def article(
    # Negative ids are valid: they address the cj_editorial namespace
    # (id = -cj_editorial.id), not just collected market_news_items rows.
    article_id: int = Path(...),
    db: AsyncSession = Depends(get_db),
):
    art = await news_service.get_article(db, article_id)
    if art is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return art
