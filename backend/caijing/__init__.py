"""CaiJing Today — Chinese/English finance-news aggregation platform.

This package implements the read side of the platform: the FastAPI service that
serves the CaiJing Today frontend. It writes nothing.

The database schema it reads is published as an explicit contract in
``docs/SCHEMA.sql`` — 15 tables and 2 views. Apply that file to a PostgreSQL
database and every panel in the UI has something to read. A data collector
(aggregating external finance feeds) populates those tables; the collector is a
separate component and is not part of this repository, so the repository ships
synthetic demo data (``docs/samples/demo_data.sql``) instead.
"""
