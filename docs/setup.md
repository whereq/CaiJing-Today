# Setup

Three ways to get it running, from easiest to most granular. The first one is
all most people need.

---

## 1. Docker Compose (recommended)

**Requirements:** Docker with Compose v2. Nothing else — no Python, no Node,
no local database.

```bash
git clone https://github.com/whereq/CaiJing-Today.git
cd CaiJing-Today

cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up -d --build
```

| | |
|---|---|
| Web UI | <http://localhost:8080> |
| API | <http://localhost:8000> |
| API docs | <http://localhost:8000/docs> |
| PostgreSQL | `localhost:5432` (`caijing` / `caijing` / `caijing`) |

The stack is self-contained. On first boot PostgreSQL applies
`docs/SCHEMA.sql` and then loads `docs/samples/demo_data.sql`, so every panel
has content the moment the site comes up.

**Start over from an empty database:**

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

`-v` removes the database volume. PostgreSQL only runs its init scripts when
the data directory is empty, so this is how you re-apply the schema.

**Bring up an empty database (no demo rows):** set `LOAD_DEMO_DATA=false` in
`docker/.env` before the first `up`.

**Watch the logs:**

```bash
docker compose -f docker/docker-compose.yml logs -f caijing-api
```

### Configuration

Everything lives in `docker/.env`. The defaults work as shipped.

| Variable | Default | What it does |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `caijing` | The database the stack creates. |
| `POSTGRES_PASSWORD_ENCODED` | `caijing` | The password in URL-encoded form, used inside `DATABASE_URL`. Percent-encode it if your password contains `@ : / ? # [ ] %`. |
| `POSTGRES_PORT` | `5432` | The host port PostgreSQL is published on. Change it if you already run Postgres locally. |
| `LOAD_DEMO_DATA` | `true` | Whether to load the synthetic demo dataset. |
| `API_PORT` | `8000` | The host port the API is published on. |
| `FRONTEND_PORT` | `8080` | The host port the web UI is published on. |
| `KEYCLOAK_URL` / `KEYCLOAK_REALM` / `KEYCLOAK_CLIENT_ID` | placeholders | Your OIDC provider. Only needed for sign-in. |
| `VITE_KEYCLOAK_URL` / `VITE_KEYCLOAK_REALM` / `VITE_KEYCLOAK_CLIENT_ID` | placeholders | The same three values, needed at **build** time for the front end. |
| `SEED_FALLBACK_ENABLED` | `false` | Serve the built-in synthetic fallback instead of the database. |

---

## 2. Docker Compose, with hot reload

Same services, but the source is bind-mounted and both tiers reload.

```bash
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.dev.yml up -d
```

| | |
|---|---|
| Vite dev server | <http://localhost:5174> |
| API (uvicorn `--reload`) | <http://localhost:8001> |

Edit a file under `backend/` or `frontend/src/` and the change is live.

The dev front end proxies `/api` to `http://caijing-api:8000` inside the
compose network. The dev API port on the host is `8001`.

---

## 3. On the host

**Requirements:** Python 3.12+, Node 22+, and a PostgreSQL 12+ you can create
a database in.

### The database

```bash
createdb caijing
psql -d caijing -f docs/SCHEMA.sql
psql -d caijing -f docs/samples/demo_data.sql
```

Both files are plain SQL and apply with any client. `docs/SCHEMA.sql` is
idempotent in the sense that it either applies cleanly or fails loudly — it
uses `CREATE TABLE`, not `CREATE TABLE IF NOT EXISTS`, so applying it twice
fails with "already exists", which is the behaviour you want.

### The backend

```bash
cd backend

python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env      # then edit DATABASE_URL
uvicorn api.main:app --reload --port 8000
```

`backend/.env.example` defaults to
`postgresql+asyncpg://caijing:caijing@localhost:5432/caijing`, which matches
the database you just created.

The API is at <http://localhost:8000>, with interactive documentation at
`/docs`.

### The front end

```bash
cd frontend
npm ci
npm run dev
```

The Vite dev server runs on <http://localhost:5173> and proxies `/api` to
`http://localhost:8000`.

Point it somewhere else with an environment variable:

```bash
API_PROXY_TARGET=http://localhost:8001 npm run dev
```

### Without a database at all

If you just want to see the interface, turn on the synthetic fallback. The API
then serves `backend/caijing/seed.py` instead of querying anything.

```bash
cd backend
SEED_FALLBACK_ENABLED=true uvicorn api.main:app --port 8000
```

---

## Verifying the installation

```bash
# The API is up and the database answered
curl -s http://localhost:8000/api/v1/health

# The feed has content
curl -s "http://localhost:8000/api/v1/news/hot?range=24h&limit=3"

# The market panels have content
curl -s http://localhost:8000/api/v1/market/quotes
```

A healthy stack answers the first with `{"status":"ok","database":true}`.

To check the schema contract against your database directly:

```bash
cd backend
python -m caijing.schema_check
```

It prints `No schema drift detected.` when the ORM mirror and the live
database agree, and exits 1 with the offending columns when they do not.

---

## Common problems

**The web UI loads but every panel is empty.**
The API is not reaching the database. Check
`docker compose -f docker/docker-compose.yml logs caijing-api` for
`Database not reachable at startup`. The usual cause is a password that was
changed in `docker/.env` without updating `POSTGRES_PASSWORD_ENCODED` — the
two must match, and the second one must be URL-encoded.

**The site shows "no results" everywhere.**
The demo data did not load. It only loads on first boot, so if the database
volume already existed the init scripts were skipped. Run
`docker compose -f docker/docker-compose.yml down -v` and start again.

**Sign-in does nothing.**
The realm is a placeholder. `KEYCLOAK_URL`, `KEYCLOAK_REALM` and
`KEYCLOAK_CLIENT_ID` must point at a realm that exists, and the front end
needs the same three values as `VITE_KEYCLOAK_*` **at build time** —
changing them requires rebuilding the image. Browsing works regardless; that
is by design.

**Port already in use.**
Change `API_PORT`, `FRONTEND_PORT` or `POSTGRES_PORT` in `docker/.env`.
`POSTGRES_PORT` in particular collides with a local PostgreSQL.

**`pip install -r requirements.txt` fails to build `pydantic-core`.**
Your Python is newer than 3.12 and the pinned versions have no prebuilt
wheel for it. Use Python 3.12.

---

## Where to go next

- [architecture.md](architecture.md) — how the pieces fit together.
- [database.md](database.md) — the schema, table by table.
- [deployment.md](deployment.md) — running this somewhere real.
- [testing.md](testing.md) — the test suites.
