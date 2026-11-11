"""Search endpoint (public)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from caijing import news_service
from caijing.database import get_db
from api.schemas.news import SearchResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search_news(
    q: str = Query(default="", description="Free-text query over titles + summaries"),
    range: str = Query(default="30d"),
    limit: int = Query(default=30, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Search the window and report the real match count alongside the page."""
    hours = news_service.range_to_hours(range)
    results, total = await news_service.search(db, query=q, hours=hours, limit=limit)
    return SearchResponse(results=results, total=total)
