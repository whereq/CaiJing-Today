"""CaiJing Today category taxonomy + mapping from news/signals.

The 12 categories mirror the design (CATS). The `market_news_items` /
`market_signals` schema has no native "category" column, so we derive one from
the signal's `signal_type`, `sectors_affected`, `regions`, symbols and theme
tags. When the schema contract gains a native category column, this mapping
becomes the fallback.
"""

from __future__ import annotations

from typing import Optional

# (id, name_cn, name_en, accent color) — order defines nav + tile order.
CATEGORIES: list[tuple[str, str, str, str]] = [
    ("macro", "宏观", "MACRO", "#0B63CE"),
    ("equities", "股市", "EQUITIES", "#c0392b"),
    ("us", "美股", "US STOCKS", "#1f6f5c"),
    ("bonds", "债券", "BONDS", "#5b4b8a"),
    ("fx", "外汇", "FX", "#0f7b8a"),
    ("commodities", "大宗商品", "COMMODITIES", "#a35b12"),
    ("crypto", "加密", "CRYPTO", "#7a4bbd"),
    ("realestate", "房产", "REAL ESTATE", "#6b6b1e"),
    ("tech", "科技", "TECH", "#1b5fa8"),
    ("companies", "公司", "COMPANIES", "#8a3d6b"),
    ("policy", "政策", "POLICY", "#2f6a2f"),
    ("opinion", "观点", "OPINION", "#5a5a63"),
]

CATEGORY_IDS: list[str] = [c[0] for c in CATEGORIES]
_BY_ID = {c[0]: c for c in CATEGORIES}

# GICS sector name (as written into sectors_affected) → caijing category.
_SECTOR_TO_CAT: dict[str, str] = {
    "Information Technology": "tech",
    "Technology": "tech",
    "Communication Services": "tech",
    "Energy": "commodities",
    "Materials": "commodities",
    "Financials": "equities",
    "Real Estate": "realestate",
    "Consumer Discretionary": "companies",
    "Consumer Staples": "companies",
    "Industrials": "companies",
    "Health Care": "companies",
    "Healthcare": "companies",
    "Utilities": "companies",
}

# Keywords in theme tags / titles that strongly imply a category.
_CRYPTO_HINTS = ("crypto", "bitcoin", "btc", "ethereum", "eth", "token", "defi", "stablecoin", "加密", "比特币", "以太")
_BOND_HINTS = ("bond", "yield", "treasury", "国债", "债券", "收益率")
_FX_HINTS = ("yuan", "dollar", "forex", "currency", "汇率", "人民币", "美元")
_REALESTATE_HINTS = ("property", "housing", "real estate", "reit", "房地产", "楼市", "房产")


def category_meta(cat_id: str) -> tuple[str, str, str, str]:
    """Return the (id, cn, en, color) tuple for a category id (defaults to macro)."""
    return _BY_ID.get(cat_id, CATEGORIES[0])


def _hit(text: str, hints: tuple[str, ...]) -> bool:
    low = text.lower()
    return any(h in low for h in hints)


def classify(
    *,
    signal_type: Optional[str],
    sectors_affected: Optional[list[str]],
    regions: Optional[list[str]],
    theme_tags: Optional[list[str]],
    title: str = "",
    language: str = "en",
) -> str:
    """Map a news item + its signal to a caijing category id.

    Best-effort and deterministic. Order matters: specific asset classes (crypto,
    bonds, fx, real estate) win over the coarse signal_type.
    """
    hint_text = " ".join([title, *(theme_tags or [])])

    if _hit(hint_text, _CRYPTO_HINTS):
        return "crypto"
    if _hit(hint_text, _REALESTATE_HINTS):
        return "realestate"
    if _hit(hint_text, _BOND_HINTS):
        return "bonds"
    if _hit(hint_text, _FX_HINTS):
        return "fx"

    st = (signal_type or "").lower()
    if st in ("earnings", "corporate"):
        return "companies"
    if st == "regulatory":
        return "policy"
    if st == "geopolitical":
        return "macro"
    if st == "sector":
        for sec in sectors_affected or []:
            if sec in _SECTOR_TO_CAT:
                return _SECTOR_TO_CAT[sec]
        return "equities"

    # macro or unknown: split US vs CN equity/macro by region.
    regions = regions or []
    if st == "macro":
        return "macro"
    if "US" in regions and "CN" not in regions:
        return "us"
    if "CN" in regions:
        return "equities"
    return "macro"
