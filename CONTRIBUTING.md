# Contributing to CaiJing Today

Thanks for taking the time. This document covers how to get the project
running, what the conventions are, and what a good pull request looks like.

## Getting it running

You need Python 3.12+, Node 22+ and Docker (for the database).

```bash
git clone https://github.com/whereq/CaiJing-Today.git
cd CaiJing-Today
```

The fastest path to a working site is the Docker stack, which brings up
PostgreSQL, applies the schema contract and loads the synthetic demo data:

```bash
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up -d --build
```

- Web UI — <http://localhost:8080>
- API — <http://localhost:8000> (interactive docs at `/docs`)

For hot-reload development, use the dev stack instead:

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

- Vite dev server — <http://localhost:5174>

See [docs/setup.md](docs/setup.md) for the full walkthrough, including running
the backend and frontend directly on the host.

## Running the tests

```bash
# Backend — from backend/
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
pytest -q
ruff check .

# Frontend — from frontend/
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Both suites run without a database. One backend test
(`tests/test_schema_drift.py`) compares the ORM mirror against a live
database and skips itself when there is none — the committed snapshot
(`tests/schema_snapshot.json`) is what guards the mirror offline.

## How the project fits together

CaiJing Today is a **reader**. It serves a database and never writes to it.

```
frontend/  React 19 SPA  ──/api/v1──▶  backend/  FastAPI  ──▶  PostgreSQL
                                    reads docs/SCHEMA.sql
```

The schema is a published contract: [`docs/SCHEMA.sql`](docs/SCHEMA.sql)
defines 15 tables and 2 views, and `backend/caijing/models/` mirrors them as
read-only ORM models. The drift guard in `backend/caijing/schema_check.py`
compares the two and fails loudly if they diverge.

That contract is the seam. If you change the schema, change it in three
places, in this order:

1. `docs/SCHEMA.sql` — the contract.
2. `backend/caijing/models/` — the mirror.
3. `backend/tests/schema_snapshot.json` — the offline guard
   (`python -m caijing.schema_check --write-snapshot` against a live database).

CI applies `docs/SCHEMA.sql` to a real PostgreSQL and runs the drift check
against it, so a change that only touches one of the three fails the build.

## Conventions

**Backend**

- Python 3.12. `ruff` for linting and formatting; line length 100.
- Type hints on public functions. `from __future__ import annotations` at the
  top of modules that need it.
- Docstrings explain *why*, not *what*. The existing code is the reference.
- The API is read-only. No route writes to the database.

**Frontend**

- TypeScript strict. `npm run lint` must pass with zero warnings.
- Bilingual by default: every user-facing string goes in
  `src/i18n/locales/en.json` and `src/i18n/locales/zh.json`. Chinese is the
  default locale.
- Colour tokens live in `src/index.css` as CSS custom properties. Do not
  hard-code hex values in components.
- Components are `.tsx`; plain helpers are `.ts`.

**Both**

- Timestamps in the database are naive UTC, serialised by
  `caijing.timeutil.iso_utc()`. The one deliberate exception is
  `cj_editorial.published_at`, which is Beijing local time by design — see the
  header of `docs/SCHEMA.sql`.
- Comments in English; UI strings in both English and Simplified Chinese.

## Pull requests

1. Open an issue first for anything substantial, so the design can be agreed
   before the code is written.
2. Keep the change focused. One concern per pull request.
3. Add tests for behaviour you change. A bug fix should come with the test
   that would have caught it.
4. Make sure `pytest -q`, `ruff check .`, `npm run lint`, `npm run typecheck`,
   `npm test` and `npm run build` all pass locally.
5. Write a commit message that says what changed and why. The `main` branch is
   squashed on release, so the message in the pull request is what reviewers
   read.

## Reporting bugs

Open an issue with: what you did, what you expected, what happened, and the
version or commit. A screenshot or the browser console output helps a lot.

Security problems are **not** public issues — see
[SECURITY.md](SECURITY.md).

## Adding data

Two ways to get content into the UI:

**The demo dataset** — `docs/samples/demo_data.sql` — is synthetic and lives
in this repository. It is the fastest way to see a working site.

**Your own collector** — a separate component that writes to the schema
defined in `docs/SCHEMA.sql`. Nothing in this repository collects data, so
this is where you plug in your own.

If you contribute demo data, the rules in the header of
`docs/samples/demo_data.sql` are binding: no real headlines, no real market
levels, no real URLs, and timestamps relative to load time.

## Trademarks

The MIT licence covers the source code. It does not cover the "CaiJing Today"
name or the 财经今日 wordmark. If you want to ship your own product under
your own name, that is welcome and needs no permission — just do not imply
the official project endorses it.
