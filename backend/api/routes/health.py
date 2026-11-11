"""Health + metadata endpoints (public, no auth — Docker health checks use these)."""

from fastapi import APIRouter

from caijing.database import check_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    try:
        await check_db()
        db_ok = True
    except Exception:
        db_ok = False
    return {"status": "ok" if db_ok else "degraded", "database": db_ok}
