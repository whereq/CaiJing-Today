"""JWT authentication via Keycloak (OIDC).

Most of the CaiJing Today read API is public (news is meant to be browsed
without an account), so routes use `OptionalUser` rather than a hard dependency.
Use `CurrentUser` only where a signed-in user is genuinely required.
"""

import logging
import time
from typing import Annotated, Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt

from caijing.config import get_settings

logger = logging.getLogger(__name__)

_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600.0  # seconds


async def _get_jwks() -> dict:
    """Return cached Keycloak public keys, refreshing when stale."""
    global _jwks_cache, _jwks_fetched_at

    now = time.monotonic()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    settings = get_settings()
    url = (
        f"{settings.keycloak_url}/realms/{settings.keycloak_realm}"
        "/protocol/openid-connect/certs"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_fetched_at = now
            logger.info("Keycloak JWKS refreshed from %s", url)
    except Exception as exc:
        if _jwks_cache:
            logger.warning("JWKS refresh failed (using cached keys): %s", exc)
        else:
            logger.error("JWKS fetch failed and no cache available: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service temporarily unavailable",
            )
    return _jwks_cache  # type: ignore[return-value]


_bearer_required = HTTPBearer(auto_error=True)
_bearer_optional = HTTPBearer(auto_error=False)


async def _verify(token: str) -> dict:
    settings = get_settings()
    expected_issuer = f"{settings.keycloak_url}/realms/{settings.keycloak_realm}"
    jwks = await _get_jwks()
    payload: dict = jwt.decode(
        token,
        jwks,
        algorithms=["RS256"],
        issuer=expected_issuer,
        options={"verify_aud": False, "verify_exp": True, "verify_iss": True},
    )
    if payload.get("azp") != settings.keycloak_client_id:
        raise JWTError("azp mismatch")
    payload["_raw_token"] = token
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_required),
) -> dict:
    """Verify the Bearer JWT and return its decoded claims. 401 on failure."""
    try:
        return await _verify(credentials.credentials)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as exc:
        logger.debug("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_optional),
) -> Optional[dict]:
    """Return decoded claims when a valid token is present, else None.

    Never raises for anonymous requests — public news browsing must work without
    a token, while signed-in users still get their claims attached.
    """
    if credentials is None:
        return None
    try:
        return await _verify(credentials.credentials)
    except (ExpiredSignatureError, JWTError, HTTPException):
        return None


CurrentUser = Annotated[dict, Depends(get_current_user)]
OptionalUser = Annotated[Optional[dict], Depends(get_optional_user)]
