"""Category taxonomy endpoint (public)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from caijing import news_service
from caijing.database import get_db
from caijing.taxonomy import CATEGORIES
from api.schemas.news import CategoryInfo

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryInfo])
async def list_categories(
    hours: int = Query(default=24, ge=1, le=24 * 30),
    db: AsyncSession = Depends(get_db),
):
    """Return the 12 categories with today's article counts."""
    counts = await news_service.category_counts(db, hours=hours)
    return [
        CategoryInfo(id=cid, cn=cn, en=en, color=color, count=counts.get(cid, 0))
        for cid, cn, en, color in CATEGORIES
    ]
