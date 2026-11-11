"""Market panel endpoints (public).

Read the collector-owned `cj_*` tables via market_service. `/market/sources` is a
static catalog (the 12 aggregated outlets), not time-series, so it stays a constant.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from caijing import market_service, seed
from caijing.database import get_db
from api.schemas.market import (
    CalendarEvent,
    Chart,
    CryptoBundle,
    HotStock,
    Keyword,
    Quote,
    SectorHeat,
    SourceInfo,
)

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/quotes", response_model=list[Quote])
async def quotes(db: AsyncSession = Depends(get_db)):
    return await market_service.get_quotes(db)


@router.get("/charts", response_model=list[Chart])
async def charts(db: AsyncSession = Depends(get_db)):
    return await market_service.get_charts(db)


@router.get("/sectors", response_model=list[SectorHeat])
async def sectors(db: AsyncSession = Depends(get_db)):
    return await market_service.get_sectors(db)


@router.get("/crypto", response_model=CryptoBundle)
async def crypto(db: AsyncSession = Depends(get_db)):
    return await market_service.get_crypto(db)


@router.get("/calendar", response_model=list[CalendarEvent])
async def calendar(db: AsyncSession = Depends(get_db)):
    return await market_service.get_calendar(db)


@router.get("/keywords", response_model=list[Keyword])
async def keywords(db: AsyncSession = Depends(get_db)):
    return await market_service.get_keywords(db)


@router.get("/hotstocks", response_model=list[HotStock])
async def hotstocks(db: AsyncSession = Depends(get_db)):
    return await market_service.get_hot_stocks(db)


@router.get("/sources", response_model=list[SourceInfo])
async def sources():
    """Static catalog of aggregated outlets (not time-series)."""
    return [SourceInfo(name_cn=s[0], name_en=s[1], region=s[2]) for s in seed.SOURCES]
