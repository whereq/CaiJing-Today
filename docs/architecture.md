# Architecture

CaiJing Today is a **reader**. A FastAPI service reads a PostgreSQL database
through a published schema contract and serves it as JSON; a React SPA renders
that JSON. Neither writes to the database.

That single constraint shapes almost every design decision below.

---

## 1. The shape of the system

```
                       Browser
                          │  GET /api/v1/...
                          ▼
              ┌───────────────────────┐
              │  frontend/            │   React 19 + Vite + TypeScript
              │  nginx (prod) or      │
              │  Vite dev server      │   proxies /api → the API service
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  backend/             │   FastAPI, Python 3.12
              │  api/routes/          │   HTTP surface
              │  caijing/news_service │   shaping, ranking, categories
              │  caijing/market_service│
              │  caijing/models/      │   read-only ORM mirror
              └───────────┬───────────┘
                          │  asyncpg
                          ▼
              ┌───────────────────────┐
              │  PostgreSQL 12+       │   the contract in docs/SCHEMA.sql
              └───────────────────────┘
                          ▲
                          │  written by a collector
                          │  (a separate component, not in this repo)
```

### Why the API owns no data

There is no user table, no session table, no write path. The application is
stateless: every request is a read, and the result depends only on what is in
the database at that moment. That is what makes it cheap to run, easy to
scale horizontally, and safe to expose.

The one piece of state the front end keeps is a theme preference and the
anonymous-avatar choice, both in `localStorage`.

---

## 2. The schema contract

`docs/SCHEMA.sql` is the centre of the project. It defines 15 tables and 2
views — everything the API reads, and nothing it does not.

```
market_news_items ──┐
cj_news_meta ───────┼──▶ cj_news_feed (VIEW) ──┐
market_signals ─────┘                          │
                                               ├──▶ the API's feed
cj_editorial ──────────────────────────────────┘
```

`backend/caijing/models/` mirrors that contract as read-only SQLAlchemy
models. Three artefacts must agree:

| Artefact | What it is |
|---|---|
| `docs/SCHEMA.sql` | The contract — the DDL. |
| `backend/caijing/models/` | The mirror — the ORM's view of it. |
| `backend/tests/schema_snapshot.json` | The offline guard — a captured column list. |

`backend/caijing/schema_check.py` compares them. It has two modes:

- **against a live database** (`python -m caijing.schema_check`) — compares
  the mirror's declared columns with the tables that actually exist. A column
  the database does not have is drift.
- **against the committed snapshot** (`tests/test_schema_snapshot.py`) — the
  same comparison, but offline, so it runs in CI where no database exists.

A table that is missing entirely is *not* drift — it is "not deployed yet",
and it is skipped. That is what lets a fresh, partially-populated database
work.

CI wires this up properly: the `schema` job applies `docs/SCHEMA.sql` to a
real PostgreSQL, loads the demo data, and runs the drift check against it.
Changing one of the three artefacts without the others fails the build.

---

## 3. Reading the feed

The news feed is the busiest path, and it has two ways to read the same data.

**Preferred: the view.** `cj_news_feed` is a SQL view that unions the
collected rows with the hand-written editorial rows and joins in the
metadata and signals. One query does everything.

**Fallback: a join in Python.** If the view is not deployed, the service
detects the missing relation, flips to an equivalent three-way join, and
re-probes the view every five minutes so a freshly-created view is picked up
without a restart.

Both produce the same `FeedRow` dataclass, which is then shaped into a
`NewsCard`.

```
cj_news_feed (VIEW)  ──▶ FeedRow  ──▶ NewsCard  ──▶ JSON
        │                  ▲
        └── missing ───────┘
             3-way join: market_news_items
                          ⟕ cj_news_meta
                          ⟕ market_signals
```

### Category derivation

The schema has no `category` column on the news tables — the `cj_news_meta`
table does, but not every row has one. When a row has no category, the
service derives one from the signals it does have:

1. the signal's `signal_type`,
2. the `sectors_affected` array (mapped through the GICS vocabulary),
3. the `regions` array,
4. the symbols mentioned,
5. the theme tags,
6. finally, keywords in the title.

The result is one of twelve categories, defined in
`backend/caijing/taxonomy.py`: `macro`, `equities`, `us`, `bonds`, `fx`,
`commodities`, `crypto`, `realestate`, `tech`, `companies`, `policy`,
`opinion`. The taxonomy also owns the display names and accent colours, so a
category's name and colour cannot drift apart.

### Heat

`heat` is the ranking score. When the row carries one (`cj_news_meta.heat`),
it is used as-is. Otherwise it is computed from the publication time, the
signal's confidence and the absolute value of its sentiment, decaying with
age. The result is floored at 5.0 and capped at 99.9.

---

## 4. Degrading, never failing

Every panel returns an empty list rather than an error when its table is
missing or the database is unreachable. `_rows()` in the service layer
distinguishes two cases:

| Situation | Result | What the UI does |
|---|---|---|
| The database is reachable, the table is empty | `[]` | The panel hides. |
| The database is unreachable | `[]` (or the seed fallback) | The panel hides; the rest of the page works. |

The distinction matters for one thing: the single-snapshot tables
(`cj_sector_heat`, `cj_trending_keyword`, `cj_hot_stock`) are read with
`max(as_of)` first, so only the newest snapshot is returned. A table with no
rows at all returns no snapshot, and therefore no rows — which is correct.

There is a second fallback layer behind that. When
`SEED_FALLBACK_ENABLED=true` and the feed is empty, the service serves the
synthetic dataset in `backend/caijing/seed.py`. That is how the UI can be
demonstrated with no database at all.

---

## 5. The API surface

All routes are mounted under `/api/v1`.

| Route | Returns |
|---|---|
| `GET /health` | Liveness, plus whether the database answered. |
| `GET /news/hot` | The hottest cards in a window (`1h`, `24h`, `7d`, `30d`). |
| `GET /news/latest` | The newest cards in a window. |
| `GET /news/category/{cat}` | Cards in one taxonomy category. |
| `GET /news/boards` | Cards grouped by category, for the home board. |
| `GET /news/flash` | The 7×24 newswire. |
| `GET /news/{id}` | One article. A negative id addresses an editorial row. |
| `GET /market/quotes` | The ticker strip. |
| `GET /market/charts` | The sparkline panels. |
| `GET /market/sectors` | The sector heatmap, latest snapshot. |
| `GET /market/crypto` | Coins, chains, new listings and header stats. |
| `GET /market/calendar` | Economic events for today and the next two days. |
| `GET /market/keywords` | Trending keywords, latest snapshot. |
| `GET /market/hotstocks` | The individual-stock hot list, latest snapshot. |
| `GET /market/sources` | The static outlet catalogue. |
| `GET /categories` | The taxonomy, with counts. |
| `GET /search` | Free-text search, with the true match count. |

`frontend/src/api/client.ts` is a typed mirror of these response schemas. It
is hand-written, so it can drift — the response models in
`backend/api/schemas/` are the source of truth.

---

## 6. Authentication

Browsing is public. Most routes therefore take `OptionalUser` — the decoded
claims when a valid token is present, and `None` when it is not. Nothing
breaks for an anonymous visitor.

When a token *is* present, it is verified against the OIDC provider:

1. The JWKS is fetched from
   `<KEYCLOAK_URL>/realms/<KEYCLOAK_REALM>/protocol/openid-connect/certs`
   and cached for an hour.
2. The token is decoded with RS256, verifying the issuer and the expiry.
3. The `azp` claim must equal `KEYCLOAK_CLIENT_ID`.

The front end follows the same rule: `main.tsx` calls `keycloak.init()` and
mounts the application **whether or not that call succeeds** — a failure
means anonymous mode, not a blank page.

---

## 7. The front end

```
frontend/src/
├── pages/          Home, Category, Article, Search
├── components/
│   ├── home/       the 13 home-board widgets
│   ├── chrome/     Header, Footer, Ticker, Drawer, SearchModal, UserMenu
│   └── ui.tsx      Panel, SectionHeader, Chip, BareHeader
├── lib/            format, hooks, storage, categories, sources
├── api/client.ts   typed API client
├── auth/           Keycloak init, AuthProvider, useAuth
├── contexts/       ThemeContext
└── i18n/           en.json, zh.json
```

**Theming** is CSS custom properties in `src/index.css`, with a
`ThemeContext` that follows the system preference and remembers an override.
Components reference `var(--tx1)`, never a literal colour.

**Colour convention.** In Chinese markets red means up and green means down —
the opposite of the Western convention. The design tokens follow the Chinese
convention, and the components do not second-guess it. If you localise this
for a Western audience, change the tokens in `index.css`, not the components.

**i18n** is `i18next` with `zh` as the default locale. Every user-facing
string exists in both `en.json` and `zh.json`.

---

## 8. Time

Every timestamp in the schema is **naive UTC**, and is serialised by
`caijing.timeutil.iso_utc()` so the browser parses it as UTC rather than
local time.

There is exactly one deliberate exception: `cj_editorial.published_at` is
Beijing local time, because editorial rows are published on a human schedule
and the view compares them against `now() AT TIME ZONE 'Asia/Shanghai'`. The
schema file's header documents this, and the trigger that stamps it is part
of the contract.

---

## 9. The deployment shape

`docker/docker-compose.yml` runs three services: `postgres`, `caijing-api`
and `caijing-frontend`. The front end is nginx serving the built SPA and
proxying `/api` to the API service, so only one public origin is needed.

The PostgreSQL service applies the schema contract and the demo data on
first boot, through `docker-entrypoint-initdb.d`. Because PostgreSQL runs
those scripts only when the data directory is empty, re-applying the schema
means `docker compose down -v`.

`docker/docker-compose.dev.yml` is the same stack with hot reload: uvicorn
with `--reload` and the source bind-mounted, and the Vite dev server in
place of the built bundle.

For self-hosting beyond the compose stack — a reverse proxy, TLS, a managed
database — see [deployment.md](deployment.md).

---

## 10. Where to start reading

1. [docs/setup.md](setup.md) — get it running.
2. `backend/caijing/schema_check.py` — the canary for any schema change.
3. `backend/caijing/news_service.py` — the feed path, in full.
4. [docs/mindmap.md](mindmap.md) — the one-page map of the whole tree.
5. [docs/database.md](database.md) — the tables, one by one.
