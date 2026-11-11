"""Schema-drift guard for the read-only mirror.

CaiJing Today maps a subset of columns on the tables published in
``docs/SCHEMA.sql``. If that schema contract changes — a column is renamed or
dropped — our SELECTs would fail at query time. This module compares each
mirrored model's DECLARED columns against the LIVE database and reports any that
have gone missing, so the drift surfaces as a loud test/log failure instead of a
runtime 500.

Used by:
  - tests/test_schema_drift.py  (CI / dev-with-DB gate)
  - api.main lifespan            (non-fatal warning at startup)

When a new `cj_*` table or view is added to the schema contract and this
application gains a read-model mirror for it, append it to MIRRORED_MODELS.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncEngine

from caijing import models

logger = logging.getLogger(__name__)

# Snapshot of the live column names, committed to the repo. It lets the
# read-model guard run WITHOUT a database — which is the case in CI, where the
# database is not reachable. Without it the drift check would silently skip and
# the mirror could drift unnoticed until the next release.
SNAPSHOT_PATH = Path(__file__).resolve().parent.parent / "tests" / "schema_snapshot.json"

# Every model this application maps onto the published schema contract.
MIRRORED_MODELS = [
    models.MarketNewsItem,
    models.MarketSignal,
    models.SectorIntelligence,
    models.CjNewsMeta,
    models.CjFlash,
    models.CjMarketQuote,
    models.CjSectorHeat,
    models.CjCryptoCoin,
    models.CjCryptoChain,
    models.CjCryptoListing,
    models.CjMarketMetric,
    models.CjEconEvent,
    models.CjTrendingKeyword,
    models.CjHotStock,  # finance 热榜; skipped by the guard until the collector deploys it
    models.CjNewsFeed,  # a VIEW; skipped by the guard until it is deployed
    models.CjEditorialDetail,  # a VIEW; skipped by the guard until it is deployed
]


def _declared_columns(model) -> set[str]:
    return {c.name for c in model.__table__.columns}


async def check_schema_drift(engine: AsyncEngine) -> dict[str, list[str]]:
    """Return {table: [missing columns]} for mirrors that have drifted.

    A table that is absent from the DB entirely is treated as "not deployed yet"
    (skipped, not drift) so fresh dev databases don't trip the guard. Raises if
    the database is unreachable — the caller decides whether to skip or warn.
    """

    def _inspect(sync_conn) -> dict[str, list[str]]:
        insp = inspect(sync_conn)
        drift: dict[str, list[str]] = {}
        for m in MIRRORED_MODELS:
            table = m.__tablename__
            if not insp.has_table(table):
                continue  # schema not deployed here — not a drift signal
            actual = {c["name"] for c in insp.get_columns(table)}
            missing = sorted(_declared_columns(m) - actual)
            if missing:
                drift[table] = missing
        return drift

    async with engine.connect() as conn:
        return await conn.run_sync(_inspect)


async def capture_snapshot(engine: AsyncEngine) -> dict[str, list[str]]:
    """Capture the live column names of every mirrored table that exists.

    Returns `{table: [column, ...]}`. Tables that are not deployed are simply
    absent from the result.
    """

    def _inspect(sync_conn) -> dict[str, list[str]]:
        insp = inspect(sync_conn)
        out: dict[str, list[str]] = {}
        for m in MIRRORED_MODELS:
            table = m.__tablename__
            if not insp.has_table(table):
                continue
            out[table] = sorted(c["name"] for c in insp.get_columns(table))
        return out

    async with engine.connect() as conn:
        return await conn.run_sync(_inspect)


def load_snapshot() -> dict[str, list[str]]:
    """Read the committed snapshot; an empty dict when it has not been captured."""
    try:
        with SNAPSHOT_PATH.open(encoding="utf-8") as fh:
            data: dict[str, Any] = json.load(fh)
    except FileNotFoundError:
        return {}
    return {k: list(v) for k, v in data.items()}


def write_snapshot(snapshot: dict[str, list[str]]) -> None:
    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with SNAPSHOT_PATH.open("w", encoding="utf-8") as fh:
        json.dump(snapshot, fh, indent=2, sort_keys=True, ensure_ascii=False)
        fh.write("\n")


def snapshot_drift(snapshot: dict[str, list[str]]) -> dict[str, list[str]]:
    """Compare the declared mirror columns against the committed snapshot.

    Same rule as the live check: a column we declare but the live schema does
    not have is drift. Tables missing from the snapshot are treated as "not
    deployed yet" and skipped.
    """
    drift: dict[str, list[str]] = {}
    for m in MIRRORED_MODELS:
        table = m.__tablename__
        if table not in snapshot:
            continue
        actual = set(snapshot[table])
        missing = sorted(_declared_columns(m) - actual)
        if missing:
            drift[table] = missing
    return drift


async def _main() -> int:
    """CLI entrypoint: `python -m caijing.schema_check`.

    Compares the declared read-model mirror against the live database and
    reports any column that has gone missing. Exits 1 on drift so the caller
    can warn (non-fatal by design, same as the startup check); exits 2 if the DB
    is unreachable.

    `--write-snapshot` refreshes the committed snapshot from the live database.
    Run it after the schema contract in `docs/SCHEMA.sql` changes so the
    offline guard in CI stays accurate.
    """
    import argparse

    from caijing.database import async_engine

    parser = argparse.ArgumentParser(description="CaiJing Today read-model schema guard")
    parser.add_argument(
        "--write-snapshot",
        action="store_true",
        help="Refresh tests/schema_snapshot.json from the live database.",
    )
    args = parser.parse_args()

    try:
        if args.write_snapshot:
            snapshot = await capture_snapshot(async_engine)
            write_snapshot(snapshot)
            print(f"Wrote schema snapshot for {len(snapshot)} tables → {SNAPSHOT_PATH}")
            return 0

        drift = await check_schema_drift(async_engine)
    except Exception as exc:  # noqa: BLE001
        print(f"Could not check schema drift — DB unreachable: {exc}")
        return 2

    if not drift:
        print("No schema drift detected.")
        return 0

    print("Schema drift detected:")
    for table, missing in drift.items():
        print(f"  {table}: missing {missing}")
    return 1


if __name__ == "__main__":
    import asyncio
    import sys

    sys.exit(asyncio.run(_main()))
