"""Timestamp helpers.

All timestamps in the shared DB are `timestamp WITHOUT time zone` = naive UTC.
Serialize them as explicit-UTC ISO strings so the browser's `new Date(iso)` parses
them as UTC rather than local time (otherwise every "x minutes ago" is skewed by
the client's timezone offset).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional


def iso_utc(dt: Optional[datetime]) -> str:
    """Return an ISO-8601 string with an explicit +00:00 offset (empty if None)."""
    if dt is None:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def hhmm_utc(dt: Optional[datetime]) -> str:
    """Return HH:MM (UTC) for a naive-UTC timestamp (empty if None)."""
    if dt is None:
        return ""
    return f"{dt.hour:02d}:{dt.minute:02d}"
