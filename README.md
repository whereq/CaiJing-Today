<div align="center">

# CaiJing Today · 财经今日

**A bilingual (Chinese/English) finance-news board — hot rankings, a 7×24 newsflash, market panels and search.**

[MIT licensed](LICENSE) · Python 3.12 · React 19 · PostgreSQL 17

</div>

---

CaiJing Today is a read-only finance-news front end: a FastAPI service and a
React SPA that render a database of headlines, flash items, quotes, sector
heat, crypto and an economic calendar into a dense, bilingual board.

**It is a reader, not a scraper.** This repository ships the schema it reads —
[`docs/SCHEMA.sql`](docs/SCHEMA.sql) — as an explicit contract, plus a
synthetic demo dataset so you can run the whole thing before you have any
data of your own. The collector that fills those tables in production is a
separate component and is not part of this repository; plugging in your own
is the intended extension point.

Nothing about any particular deployment is baked in. No API keys, no hosted
service, no accounts.

## What you get

| | |
|---|---|
| **Home board** | A responsive 1/2/3-column grid of 13 widgets: hot rankings, flash feed, sector heatmap, crypto, trending keywords, global markets, mini charts and more. |
| **Two languages** | Simplified Chinese and English throughout — headlines, summaries, categories, interface chrome. Chinese is the default. |
| **Category boards** | Twelve categories, derived automatically from each item's signal type, sectors, regions and tags. |
| **Search** | Free-text search across titles and summaries, reporting the true number of matches rather than a capped count. |
| **Flash feed** | A 7×24 newswire, with an article sidebar that follows you as you read. |
| **Market panels** | A scrolling quote strip, sparkline charts, a sector heatmap, crypto coins and chains, an economic calendar, trending keywords and an individual-stock hot list. |
| **Optional sign-in** | Authentication is delegated to your own OpenID Connect provider. Browsing is public, so the site works with no identity provider at all. |
| **Dark and light** | A theme that follows your system and remembers your choice. |

## Quick start

You need Docker with Compose v2. Nothing else.

```bash
git clone https://github.com/whereq/CaiJing-Today.git
cd CaiJing-Today

cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up -d --build
```

Then open <http://localhost:8080>.

The stack brings up PostgreSQL 17, applies the schema contract, loads the
synthetic demo data and serves the site. The API is on
<http://localhost:8000>, with interactive documentation at `/docs`.

Every default in `docker/.env.example` works as shipped — the credentials in
it are local development credentials, not secrets. Change them before you put
the stack on a network. See [SECURITY.md](SECURITY.md).

## What you need to run it

Nothing, if you use the Docker stack.

If you run it on the host instead, you need Python 3.12+, Node 22+ and a
PostgreSQL 12+ database you have applied the schema contract to. Sign-in is
optional; if you want it, you need an OpenID Connect provider and its three
settings:

| Setting | Why |
|---|---|
| `KEYCLOAK_URL` | The OIDC issuer root. The backend fetches the JWKS from `<URL>/realms/<REALM>/protocol/openid-connect/certs`. |
| `KEYCLOAK_REALM` | The realm that holds your users. |
| `KEYCLOAK_CLIENT_ID` | The public (SPA) client id. The backend checks it against the token's `azp` claim. |

The shipped values are placeholders (`https://auth.example.com`,
`caijing-today`, `caijing-today-spa`). With them unset, the UI stays in
anonymous mode and everything still works.

## Architecture

```
   Browser
      │  /api/v1  (nginx proxies to the API service)
      ▼
   frontend/            React 19 + Vite + TypeScript SPA
      │                     ↕ typed client (src/api/client.ts)
      ▼
   backend/             FastAPI — read-only
      │                     │
      │                     ├── caijing/models/            read-only ORM mirror
      │                     ├── caijing/schema_check.py   drift guard
      ▼
   PostgreSQL           the schema contract in docs/SCHEMA.sql
                            ▲
                            │  written by a collector (not in this repo)
```

Two rules hold the whole thing together:

**The schema is a contract, not an implementation detail.**
[`docs/SCHEMA.sql`](docs/SCHEMA.sql) defines exactly what the API reads, and
`backend/caijing/models/` mirrors it as read-only ORM models. A guard compares
the two — against the live database when one is attached, and against a
committed snapshot when it is not — so a drift fails the build instead of
failing at query time.

**Every panel degrades to empty, never to an error.**
A missing table or an unreachable database returns `[]`, not a 500. The UI
hides the panel and the rest of the page keeps working.

See [docs/architecture.md](docs/architecture.md) for the full picture.

## The demo data

`docs/samples/demo_data.sql` fills every panel with plausible, entirely
**invented** content — no real headline, no real price, no real URL. Instrument
names are real because they are the taxonomy the interface renders against;
every value attached to them is fabricated, and every timestamp is relative to
load time so the "1h / 24h / 7d" windows stay populated.

The rules the fixture is written against are in the header of that file, and
they are binding for any data you contribute.

To bring up an empty database instead, set `LOAD_DEMO_DATA=false` in
`docker/.env`.

## Running on the host

<details>
<summary>Backend and frontend, without Docker</summary>

```bash
# Database
createdb caijing
psql -d caijing -f docs/SCHEMA.sql
psql -d caijing -f docs/samples/demo_data.sql

# Backend
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # point DATABASE_URL at your database
uvicorn api.main:app --reload --port 8000

# Frontend (another shell)
cd frontend
npm ci
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8000`. Point it
somewhere else with `API_PROXY_TARGET`.

</details>

## Tests

```bash
cd backend  && pytest -q && ruff check .
cd frontend && npm ci && npm run lint && npm run typecheck && npm test && npm run build
```

Both suites run without a database. CI adds two gates that a local run does
not have: it applies the schema contract to a real PostgreSQL and checks the
ORM mirror against it, and it builds both Docker images.

## Documentation

| | |
|---|---|
| [docs/setup.md](docs/setup.md) | Getting it running, every way. |
| [docs/architecture.md](docs/architecture.md) | How the pieces fit, and why. |
| [docs/database.md](docs/database.md) | The schema contract, table by table. |
| [docs/data-sources.md](docs/data-sources.md) | Where data comes from, and what you owe the sources. |
| [docs/testing.md](docs/testing.md) | What is tested, and how to add to it. |
| [docs/SCHEMA.sql](docs/SCHEMA.sql) | The contract itself. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Conventions and pull requests. |
| [SECURITY.md](SECURITY.md) | Reporting a vulnerability. |

## Licence

MIT — see [LICENSE](LICENSE). Third-party components and their obligations are
listed in [NOTICE](NOTICE).

This is a financial-information interface, not financial advice. Nothing it
displays is a recommendation to buy or sell anything.
