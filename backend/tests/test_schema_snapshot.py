"""Offline read-model guard — runs everywhere, including CI without a database.

The live drift check (`tests/test_schema_drift.py`) needs a database. CI has no
access to one, so there the check would skip and the hand-written mirror in
`caijing/models/` could drift unnoticed.

This test compares the mirror's declared columns against a committed snapshot
of the live schema (`tests/schema_snapshot.json`), captured with:

    python -m caijing.schema_check --write-snapshot

Refresh the snapshot whenever the schema contract in `docs/SCHEMA.sql` changes.
"""

from caijing.schema_check import MIRRORED_MODELS, load_snapshot, snapshot_drift


def test_snapshot_exists_and_is_not_empty():
    snapshot = load_snapshot()
    assert snapshot, (
        "backend/tests/schema_snapshot.json is missing or empty — capture it with "
        "`python -m caijing.schema_check --write-snapshot` against the database."
    )


def test_mirror_columns_exist_in_the_snapshot():
    snapshot = load_snapshot()
    drift = snapshot_drift(snapshot)
    assert not drift, (
        "The read-only mirror declares columns the live schema does not have: "
        f"{drift}. The schema contract changed — update caijing/models/ to match."
    )


def test_every_mirrored_table_is_covered_by_the_snapshot():
    """A table missing from the snapshot is silently unguarded."""
    snapshot = load_snapshot()
    unguarded = [m.__tablename__ for m in MIRRORED_MODELS if m.__tablename__ not in snapshot]
    assert not unguarded, (
        f"These mirrored tables are not in the snapshot and are therefore "
        f"unguarded offline: {unguarded}. Re-capture the snapshot."
    )
