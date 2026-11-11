# Mindmap

One page, the whole tree. For the reasoning behind it, see
[architecture.md](architecture.md); for the data, see [database.md](database.md).

---

## The tree

```
CaiJing-Today
│
├── backend/                    FastAPI — Python 3.12, read-only
│   ├── caijing/
│   │   ├── config.py           Settings (pydantic-settings, .env)
│   │   ├── database.py         async engine, session factory, Base
│   │   ├── auth.py             OIDC JWT (JWKS cache, RS256, OptionalUser/CurrentUser)
│   │   ├── timeutil.py         iso_utc(dt) → ISO with +00:00
│   │   ├── taxonomy.py         12 categories, colours, classify()
│   │   ├── seed.py             synthetic fallback (only if SEED_FALLBACK_ENABLED)
│   │   ├── schema_check.py     MIRRORED_MODELS + the drift guard
│   │   ├── news_service.py     the feed: view → join, shaping, ranking, search
│   │   ├── market_service.py   the market panels
│   │   └── models/
│   │       ├── market_intelligence.py   market_news_items, market_signals,
│   │       │                           sector_intelligence
│   │       └── caijing_market.py        the cj_* tables and the two views
│   ├── api/
│   │   ├── main.py             the app, CORS, lifespan
│   │   ├── routes/             health, news, market, categories, search
│   │   └── schemas/            Pydantic response models
│   ├── tests/                  pytest suite + schema_snapshot.json
│   ├── requirements.txt        pinned dependencies
│   └── pytest.ini
│
├── frontend/                   React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/              Home, Category, Article, Search
│   │   ├── components/
│   │   │   ├── Header, Footer, Ticker, Drawer, SearchModal, UserMenu,
│   │   │   │   KeywordChips, PanelStatus, Layout, ui.tsx
│   │   │   └── home/           the 13 board widgets:
│   │   │       HotRanking, EditorPicks, HotStocks, MiniCharts,
│   │   │       CategoryTiles, SectorHeatmap, CryptoZone, FlashFeed,
│   │   │       TrendingBox, CalendarBox, GlobalMarkets, CategoryBoards,
│   │   │       BrowseBySource
│   │   ├── api/client.ts       typed API client
│   │   ├── auth/               keycloak.ts, AuthProvider, useAuth, useAuthContext
│   │   ├── lib/                format, hooks, storage, categories, sources
│   │   ├── contexts/           ThemeContext
│   │   ├── i18n/               index.ts, locales/{en,zh}.json
│   │   ├── utils/avatars.ts    avatar resolution
│   │   └── index.css           design tokens (--up/--down) + reset + keyframes
│   ├── public/avatars/anonymous/   8 original SVG guest marks
│   ├── package.json / package-lock.json
│   ├── vite.config.ts          dev server + /api proxy
│   └── vitest.config.ts        the test environment
│
├── docker/
│   ├── docker-compose.yml      postgres + api + frontend
│   ├── docker-compose.dev.yml  the same, with hot reload
│   ├── api/Dockerfile.dev
│   ├── frontend/Dockerfile     the production image (Vite build → nginx)
│   ├── frontend/Dockerfile.dev the Vite dev server
│   ├── frontend/nginx.conf     SPA routing + the /api proxy
│   ├── db/init/10-load-demo.sh loads the demo data on first boot
│   └── .env.example
│
├── docs/
│   ├── setup.md                getting it running
│   ├── architecture.md         how it fits together
│   ├── database.md             the schema, table by table
│   ├── data-sources.md         where data comes from
│   ├── testing.md              the test suites
│   ├── deployment.md           running it somewhere real
│   ├── mindmap.md              this file
│   ├── SCHEMA.sql              the contract
│   └── samples/demo_data.sql   the synthetic dataset
│
└── .github/workflows/ci.yml    four gates
```

---

## The request path

```
UI click
  └─ react-router ──▶ page component
       └─ react-query ──▶ api.<endpoint>  (axios, Bearer if signed in)
            └─ axios ──▶ /api/v1/...
                 └─ FastAPI route ──▶ service function
                      ├─ /news/*:     cj_news_feed (VIEW) ──▶ fallback 3-way join
                      │                  └─▶ FeedRow ──▶ NewsCard (bilingual, heat)
                      ├─ /news/{negative id}:  cj_editorial_detail (VIEW) ──▶ Article
                      └─ /market/*:   direct cj_* table queries
                             └─▶ Quote / Chart / SectorHeat / Coin / …

                        asyncpg ──▶ PostgreSQL
                                          ▲
                                          │ written by a collector
                                          │ (a separate component)

JSON (pydantic) ──▶ axios ──▶ react-query cache ──▶ component re-render
```

---

## Where each concern lives

| Concern | File |
|---|---|
| Configuration | `backend/caijing/config.py` |
| The database connection | `backend/caijing/database.py` |
| Token verification | `backend/caijing/auth.py` |
| UTC serialisation | `backend/caijing/timeutil.py` |
| The category taxonomy | `backend/caijing/taxonomy.py` |
| The schema-drift guard | `backend/caijing/schema_check.py` |
| Feed shaping and ranking | `backend/caijing/news_service.py` |
| Market panel shaping | `backend/caijing/market_service.py` |
| The ORM mirror | `backend/caijing/models/` |
| The HTTP surface | `backend/api/routes/` |
| The response models | `backend/api/schemas/` |
| The API client | `frontend/src/api/client.ts` |
| The colour tokens | `frontend/src/index.css` |
| The translations | `frontend/src/i18n/locales/` |
| The source labels | `frontend/src/lib/sources.ts` |

---

## If you only read three files

1. [`docs/architecture.md`](architecture.md) — the shape of the system.
2. `backend/caijing/schema_check.py` — the canary for any schema change.
3. `backend/caijing/news_service.py` — the busiest path, in full.
