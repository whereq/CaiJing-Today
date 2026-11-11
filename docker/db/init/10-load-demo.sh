#!/bin/sh
# =============================================================================
# Load the synthetic demo data — runs once, on first boot of the database.
# =============================================================================
# PostgreSQL executes everything in docker-entrypoint-initdb.d once, when the
# data directory is empty, in alphabetical order. That makes this script the
# right place to decide whether the demo rows should exist at all:
#
#   LOAD_DEMO_DATA=true   (default) → load docs/samples/demo_data.sql
#   LOAD_DEMO_DATA=false             → leave the database empty (schema only)
#
# The script runs as the postgres superuser, so it can write to the database
# without extra grants. Every row it inserts is synthetic — no real headlines,
# no real quotes, no real URLs. See docs/samples/demo_data.sql for the rules.
# =============================================================================
set -eu

DEMO_DATA_FILE=/opt/caijing/demo_data.sql

if [ "${LOAD_DEMO_DATA:-true}" != "true" ]; then
    echo "CaiJing Today: LOAD_DEMO_DATA=${LOAD_DEMO_DATA:-false} — skipping demo data."
    exit 0
fi

if [ ! -f "$DEMO_DATA_FILE" ]; then
    echo "CaiJing Today: demo data file not found at $DEMO_DATA_FILE — skipping."
    exit 0
fi

echo "CaiJing Today: loading synthetic demo data..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$DEMO_DATA_FILE"
echo "CaiJing Today: demo data loaded."
