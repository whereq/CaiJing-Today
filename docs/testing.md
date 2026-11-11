# Testing

Two suites, one per tier, plus two CI gates that neither suite covers on its
own. This document is the source of truth for **how to test, what to test, and
how to know it works**.

---

## 1. The automated tests

| Suite | Runner | Location | Needs a database? |
|---|---|---|---|
| Backend | pytest | `backend/tests/` | only `test_schema_drift.py` |
| Frontend | Vitest | `frontend/src/**/*.test.{ts,tsx}` | no |

### 1.1 Backend

| File | What it guards |
|---|---|
| `test_schema_drift.py` | the read-only mirror vs. a **live** database (skips when no database is reachable) |
| `test_schema_snapshot.py` | the read-only mirror vs. the **committed snapshot** — runs everywhere, including CI with no database |
| `test_news_service.py` | search's true match count, card and heat shaping, the view→join fallback |
| `test_market_service.py` | every `cj_*` panel degrades to `[]` (never a 500) when its table is missing |
| `test_schemas.py` | Pydantic round-trips (the TypeScript types in `frontend/src/api/client.ts` mirror these) |

The two drift guards exist because they fail in *different* situations. The
live one needs a database and skips without one. The offline one always runs,
and is what protects CI.

`backend/pytest.ini`:

```
[pytest]
asyncio_mode = auto
testpaths = tests
```

### 1.2 Running them

```bash
cd backend
pip install -r requirements.txt

pytest              # the whole suite
pytest -v           # verbose
pytest --deselect tests/test_schema_drift.py::test_no_schema_drift
```

A green run means: every model has a tablename and columns, every mirrored
column exists in both the live database and the committed snapshot, and the
services shape data correctly and degrade to empty lists instead of raising.

### 1.3 Frontend

| File | Guards |
|---|---|
| `src/lib/format.test.ts` | `pick` / `cardTitle` / `cardSource` / `timeAgo` / `heatLabel` / `changeColor` |
| `src/lib/categories.test.ts` | `catById` falls back to `macro`; the twelve ids; distinct colours |
| `src/lib/storage.test.ts` | the localStorage round-trip, including non-ASCII and corrupted values |
| `src/lib/sources.test.ts` | source label lookup and `distinctSources` |
| `src/i18n/locales.test.ts` | zh/en key parity; **no hard-coded result count or latency** |
| `src/pages/Search.test.tsx` | the header shows the API's real total and the measured round-trip |
| `src/pages/Category.test.tsx` | paging uses `offset` (never `limit > 200`); source chips use real source ids |
| `src/components/home/BrowseBySource.test.tsx` | each headline sits under the source it came from |
| `src/components/home/MiniCharts.test.tsx` | no NaN polyline; theme tokens, not hard-coded hex |
| `src/pages/Article.test.tsx` | a 404 says "not found"; a 500 does not |

Several of these are **regression guards for truthfulness fixes**: they fail
if a hard-coded count, a growing `limit`, or a mislabelled source column
comes back.

Configured in `frontend/vitest.config.ts`, deliberately separate from
`vite.config.ts` so the dev server's proxy never leaks into tests:

```
environment: jsdom
setupFiles:  ./src/test/setup.ts
```

| Path | Role |
|---|---|
| `src/test/setup.ts` | jest-dom matchers, i18n init, cleanup between tests |
| `src/test/render.tsx` | `renderWithProviders(ui, { route, path })` — QueryClient + Router + Theme + Auth |

`render.tsx` mounts the component under a `<Route>` when `path` is given, so
`useParams` and `useSearchParams` resolve the way they do in the app.

```bash
cd frontend
npm test           # single run
npm run test:watch # watch mode
```

---

## 2. Static checks

Run these on every change. They take seconds and catch the obvious mistakes
before you ever boot anything.

```bash
# Backend
cd backend
python -m compileall -q caijing api     # syntax gate
ruff check .                            # lint

# Frontend
cd frontend
npm run lint                            # eslint, zero warnings tolerated
npm run typecheck                       # tsc --noEmit
```

---

## 3. Smoke tests

Run these before committing.

### 3.1 The API

```bash
cd backend
SEED_FALLBACK_ENABLED=true uvicorn api.main:app --reload
```

In another shell:

```bash
curl -fsS http://localhost:8000/api/v1/health
# Expect: {"status":"ok","database":true}   (or "degraded" if no database)

curl -fsS http://localhost:8000/api/v1/categories | head -c 400
# Expect: a list of 12 categories

curl -fsS 'http://localhost:8000/api/v1/news/hot?range=24h&limit=5' | head -c 400
# Expect: an array of NewsCard

curl -fsS 'http://localhost:8000/api/v1/search?q=market&limit=5' | head -c 400
# Expect: {"results":[...],"total":<int>} — total is the REAL match count

curl -fsS http://localhost:8000/api/v1/market/quotes | head -c 400
# Expect: an array of Quote (or the seed fallback)

curl -fsS http://localhost:8000/api/v1/market/sectors | head -c 400
# Expect: an array of SectorHeat
```

### 3.2 The front end

```bash
cd frontend
npm run dev
```

```bash
curl -fsSI http://localhost:5173 | head -1
# Expect: HTTP/1.1 200 OK

curl -fsS http://localhost:5173/api/v1/health
# Expect: the same as the backend's health
```

The second one is the one that catches a misconfigured proxy — it goes
through the same path the browser does.

### 3.3 The whole stack

```bash
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up -d --build

curl -fsS http://localhost:8080/api/v1/health
curl -fsS http://localhost:8080/ | head -c 200
```

---

## 4. The CI gates

`.github/workflows/ci.yml` runs four jobs on every push and pull request.

| Job | What it proves |
|---|---|
| `backend` | lint, syntax and the pytest suite pass. |
| `schema` | the contract applies to a **real PostgreSQL**, the demo data loads on top of it, the ORM mirror matches it, and the suite passes against it. |
| `frontend` | lint, type-check, tests and a production build. |
| `docker` | both images build, and the compose file is valid. |

The `schema` job is the one that catches the failure mode unit tests cannot:
a change to `docs/SCHEMA.sql` that the ORM mirror does not follow. It stands
up PostgreSQL 17, applies the contract, loads the demo data, and runs
`python -m caijing.schema_check` against the result.

The `docker` job is the other one. An image is assembled from the pinned
requirements, and a dependency the image forgot to install breaks the build
in a way no unit test would catch.

---

## 5. Schema-drift regression tests

Both guards fail when a mirrored column disappears. If you intentionally
change the schema, update the mirror **and** re-capture the snapshot:

```bash
# 1. edit docs/SCHEMA.sql
# 2. update backend/caijing/models/
cd backend
python -m caijing.schema_check --write-snapshot   # against a live database
```

Step 3 needs a database. Without one, update
`backend/tests/schema_snapshot.json` by hand — it is a plain map of table
name to sorted column list.

CI's `schema` job will tell you if you got it wrong.

---

## 6. Response models are a contract too

`backend/tests/test_schemas.py` round-trips every response model. The
TypeScript types in `frontend/src/api/client.ts` mirror these field for
field — change one and you must change the other.

```python
def test_search_response_carries_the_true_total():
    resp = SearchResponse(results=[], total=1284)
    assert resp.total == 1284
```

There is no generated client, so this is a human responsibility. It is worth
checking by hand whenever you touch a response model.

---

## 7. Manual end-to-end check

Before deploying anywhere, on the machine that will serve it:

```bash
# Backend
cd backend && pytest -q && ruff check .

# Frontend
cd frontend && npm run lint && npm run typecheck && npm test && npm run build

# The stack, built the way it will be built
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml config -q     # validate
docker compose -f docker/docker-compose.yml up -d --build
docker compose -f docker/docker-compose.yml ps             # all healthy
curl -fsS http://localhost:8080/api/v1/health
```

Then open <http://localhost:8080> and confirm that every panel on the home
board has content and none of them show "0 results".

---

## 8. Adding a test

- **A bug fix comes with the test that would have caught it.** Put the test
  next to the code it guards.
- **Backend service tests mock the SQLAlchemy session** and exercise the
  shaping logic directly, so they need no database.
- **Frontend component tests** use `renderWithProviders` from
  `src/test/render.tsx` — do not render a component bare, or the router and
  query client will not be there.
- **Assert on behaviour, not on implementation.** "The header shows the real
  total" is a test; "the header calls `query.total`" is not.
