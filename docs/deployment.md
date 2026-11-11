# Deployment

The compose stack in this repository is enough to run the site. This document
covers what to do when you want to run it somewhere real.

> The production deployment of the original application used a specific
> server, a specific tunnel and a specific set of host ports. None of that is
> described here — it is not part of this repository, and none of it is
> needed to run the code.

---

## The shape of a deployment

```
       Browser
          │ HTTPS
          ▼
   ┌─────────────────┐
   │ reverse proxy   │  your TLS terminator: nginx, Caddy, Traefik, a CDN…
   └────────┬────────┘
            │ HTTP
            ▼
   ┌─────────────────┐
   │ caijing-frontend│  nginx: the built SPA + the /api proxy
   └────────┬────────┘
            │ /api/*
            ▼
   ┌─────────────────┐
   │ caijing-api     │  FastAPI, stateless
   └────────┬────────┘
            │ asyncpg
            ▼
   ┌─────────────────┐
   │ PostgreSQL      │  the schema contract, applied
   └─────────────────┘
```

**Only the front end needs to be public.** Its nginx already proxies `/api`
to the API service, so one origin serves both the SPA and the API. No
separate API hostname is required.

The API is stateless, so you can run several behind the proxy.

---

## The compose stack

```bash
cp docker/.env.example docker/.env
$EDITOR docker/.env
docker compose -f docker/docker-compose.yml up -d --build
```

Before you do that, change at least:

| Variable | Why |
|---|---|
| `POSTGRES_PASSWORD` | The shipped value is `caijing`. Change it. |
| `POSTGRES_PASSWORD_ENCODED` | The URL-encoded form of the same password. |
| `KEYCLOAK_*` and `VITE_KEYCLOAK_*` | Point at your own realm if you want sign-in. |

**Rebuild the front end when you change the OIDC settings.** They are baked
into the bundle at build time:

```bash
docker compose -f docker/docker-compose.yml up -d --build caijing-frontend
```

**The database stays off the network.** The compose stack does not publish
PostgreSQL on a host port; the API reaches it over the compose network. If
you add a `ports:` entry for it — to reach it with `psql` from the host, say —
bind it to `127.0.0.1` rather than `0.0.0.0`.

---

## Behind a reverse proxy

The front end's nginx serves the SPA and proxies the API, so your proxy only
has to do one thing: terminate TLS and forward to it.

```nginx
server {
    listen 443 ssl http2;
    server_name news.example.com;

    ssl_certificate     /etc/letsencrypt/live/news.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/news.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Two things to get right:

**Set `CORS_ORIGINS` to your public origin.** The API's CORS middleware reads
`CORS_ORIGINS` as a JSON list:

```bash
CORS_ORIGINS='["https://news.example.com"]'
```

If you forget this, the browser blocks the API calls and the page renders
empty while the network tab shows CORS errors.

**Do not cache `/api`.** The front end's nginx already sets a 30-day
immutable cache on `/assets/`, which is where the hashed bundles live. The
SPA's own `index.html` should not be cached, or a deploy will leave clients
on the old bundle.

---

## With an external database

The compose stack runs its own PostgreSQL, but the API only needs a
connection string. To use a managed database instead:

1. Create the database.
2. Apply the schema contract:

   ```bash
   psql "$DATABASE_URL" -f docs/SCHEMA.sql
   ```

3. Optionally load the demo data:

   ```bash
   psql "$DATABASE_URL" -f docs/samples/demo_data.sql
   ```

4. Point the API at it and start only the application services:

   ```bash
   DATABASE_URL='postgresql+asyncpg://user:password@db.internal:5432/caijing' \
     docker compose -f docker/docker-compose.yml up -d --build caijing-api caijing-frontend
   ```

`DATABASE_URL` is not set by the compose file directly — it is composed from
the `POSTGRES_*` variables. To override it, edit the `environment` block for
`caijing-api`, or use an `override` file:

```yaml
# docker-compose.override.yml
services:
  caijing-api:
    environment:
      DATABASE_URL: postgresql+asyncpg://user:password@db.internal:5432/caijing
```

Compose reads `docker-compose.override.yml` automatically.

---

## Managing the schema

The API never writes. The schema is applied once, out of band.

**Applying it to a fresh database** is just `psql -f docs/SCHEMA.sql`.

**Applying it to a database that already has it** fails, with "already
exists". That is the intended behaviour — a silent `IF NOT EXISTS` would
hide a half-applied schema.

To start over, drop and recreate the database. There is no down-migration,
because there are no migrations: the contract is the DDL.

**After changing the contract**, three things have to change together —
`docs/SCHEMA.sql`, `backend/caijing/models/` and
`backend/tests/schema_snapshot.json`. See
[CONTRIBUTING.md](../CONTRIBUTING.md#how-the-project-fits-together).

---

## Health checks

The API image has a health check built in:

```bash
curl -fsS http://localhost:8000/api/v1/health
# {"status":"ok","database":true}
```

`database: true` means the database answered. `status: "degraded"` means the
API is up but the database is not — worth alerting on, because the site will
render empty.

---

## What this application does not do

- **It does not collect data.** There is no scraper, no scheduler and no
  upstream fetch. The database is the only input.
- **It does not write.** No user accounts, no sessions, no writes of any
  kind. The API is safe to scale horizontally.
- **It does not manage itself.** There is no migration runner and no
  deployment script in this repository — deploying is whatever you use to
  deploy things.
