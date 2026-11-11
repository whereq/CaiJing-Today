# The database

The schema is the contract between this repository and whatever writes to it.
`docs/SCHEMA.sql` is the authoritative definition — 15 tables, 2 views, 15
sequences, 17 indexes, 28 constraints.

```bash
createdb caijing
psql -d caijing -f docs/SCHEMA.sql
psql -d caijing -f docs/samples/demo_data.sql   # optional: synthetic demo rows
```

Requires PostgreSQL 12 or newer (verified on 17). No extensions are needed:
the only procedural language used is `plpgsql`, which ships enabled.

---

## The shape of it

```
                    ┌──────────────────┐
                    │  market_signals  │  analysis attached to a news item
                    └────────┬─────────┘
                             │ news_item_id
┌──────────────────┐         │         ┌──────────────────┐
│ market_news_items│◀────────┴────────▶│  cj_news_meta    │  category, heat,
│  the headlines   │      news_item_id │  bilingual text  │  bilingual title
└────────┬─────────┘                   └──────────────────┘
         │
         │                                    ┌──────────────────┐
         └───────────────────────────────────▶│  cj_news_feed    │  VIEW
                                              │  the feed shape  │
                       ┌──────────────┐       └────────┬─────────┘
                       │ cj_editorial │──────────────────┘
                       │  hand-written│  (published rows only)
                       └──────┬───────┘
                              │
                       ┌──────▼────────┐
                       │cj_editorial_  │  VIEW
                       │    detail     │
                       └───────────────┘

cj_flash          the 7×24 newswire
cj_market_quote   the ticker strip and the sparkline panels
cj_sector_heat    the sector heatmap        (daily snapshot)
cj_market_metric  crypto header statistics
cj_crypto_coin    the coin list
cj_crypto_chain   the chain list
cj_crypto_listing newly listed tokens
cj_econ_event     the economic calendar
cj_trending_keyword  trending keywords      (daily snapshot)
cj_hot_stock      the individual-stock hot list  (per-cycle snapshot)
sector_intelligence   mirrored, but read by no endpoint
```

---

## The tables

### News

**`market_news_items`** — the headlines themselves.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` | Primary key, from a sequence. |
| `source` | `varchar(50)` | The collector's source id. `unique (source, source_id)`. |
| `source_id` | `varchar(255)` | The id within that source. |
| `title` | `text` | The original headline. Not null. |
| `summary` | `text` | The original summary. |
| `url` | `text` | The original link. |
| `published_at` | `timestamp` | Naive UTC. Not null. |
| `region` | `varchar(10)` | `CN`, `US`, … |
| `language` | `varchar(5)` | `zh` or `en`. Defaults to `en`. |
| `raw_sentiment` | `double precision` | The collector's own sentiment, if it computed one. |
| `is_processed` | `boolean` | Whether the analysis stage has handled it. |
| `created_at` | `timestamp` | When the row landed. |

**`cj_news_meta`** — the presentation layer for a headline.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` | Primary key. |
| `news_item_id` | `bigint` | The headline. `unique`. |
| `category` | `varchar(20)` | One of the twelve taxonomy ids. |
| `title_cn` / `title_en` | `text` | The bilingual headline. |
| `summary_cn` / `summary_en` | `text` | The bilingual summary. |
| `heat` | `double precision` | The ranking score. Defaults to `0`. |
| `is_flash` | `boolean` | Whether this belongs in the flash feed. |
| `updated_at` | `timestamp` | |

**`market_signals`** — the analysis attached to a headline.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` | Primary key. |
| `news_item_id` | `bigint` | The headline. `unique`. |
| `signal_type` | `varchar(30)` | `macro`, `earnings`, `geopolitical`, `corporate`, `regulatory`, `sector`, `commodity`, … |
| `sentiment` | `double precision` | Signed. |
| `confidence` | `double precision` | 0–1. |
| `impact_horizon` | `varchar(10)` | `1d`, `1w`, `1m`, `3m`. |
| `regions` | `varchar(10)[]` | |
| `sectors_affected` | `varchar(50)[]` | GICS sector names. |
| `symbols_mentioned` / `symbols_impacted` | `varchar(20)[]` | |
| `impact_direction` | `varchar(10)[]` | `positive`, `negative`, `neutral`. |
| `theme_tags` | `varchar(100)[]` | |
| `summary_zh` / `summary_en` | `text` | The bilingual signal summary. |
| `processed_at` | `timestamp` | |
| `model_used` | `varchar(50)` | Which model produced it. |

### Editorial

**`cj_editorial`** — hand-written articles. The one table this repository
never populates and never reads from directly (the API reads the view).

`kind`, `status`, `category`, `title_cn`/`title_en`, `summary_cn`/`summary_en`,
`body_cn`/`body_en`, `hero_image`, `source_name`, `author_cn`/`author_en`,
`url`, `tags`, `heat`, `is_featured`, `published_at`, `created_at`,
`updated_at`.

A trigger, `trg_cj_editorial_stamp_published`, stamps `published_at` with
`now() AT TIME ZONE 'Asia/Shanghai'` when a row is published without one.

### Flash

**`cj_flash`** — the 7×24 newswire.

`published_at` (naive UTC, not null), `text_cn`, `text_en`, `source`,
`source_id` (`unique (source, source_id)`), `importance` (1–3), `url`.

### Market panels

**`cj_market_quote`** — the ticker strip and the sparkline panels.

`symbol` (`unique`), `name_cn`, `name_en`, `asset_class`
(`index`/`fx`/`commodity`/`crypto`/`rate`), `value`, `change`, `direction`
(`1`/`-1`/`0`), `sparkline` (`jsonb`), `show_in_ticker`, `show_in_charts`,
`sort_order`, `updated_at`.

The two boolean flags drive which panel a row appears in: `show_in_ticker`
for the scrolling strip, `show_in_charts` for the mini charts.

**`cj_sector_heat`** — the sector heatmap.

`name_cn`, `name_en`, `change_pct`, `net_inflow`, `region`, `sort_order`,
`as_of` (a **date** — the snapshot day), `updated_at`.
`unique (name_en, region, as_of)`.

**`cj_market_metric`** — the crypto header statistics.

`metric_key` (`unique`), `group`, `key_cn`, `key_en`, `value_cn`, `value_en`,
`direction`, `sort_order`, `updated_at`. The API reads the `crypto` group.

**`cj_crypto_coin`** — `symbol` (`unique`), `name_cn`, `name_en`, `price`,
`change_pct`, `color`, `sort_order`, `updated_at`.

**`cj_crypto_chain`** — `name_cn`, `name_en` (`unique`), `tvl`, `gas`,
`change_pct`, `color`, `sort_order`, `updated_at`.

**`cj_crypto_listing`** — newly listed tokens. `symbol`, `venue_cn`,
`venue_en`, `listed_date`, `change_pct`, `updated_at`.
`unique (symbol, venue_en)`. Often empty — the panel hides when it is.

**`cj_econ_event`** — the economic calendar.

`event_date` (a **date**, not null), `event_time`, `importance` (1–3),
`name_cn`, `name_en`, `forecast`, `previous`, `actual`, `country`,
`updated_at`. `unique (event_date, name_en, country)`.

The API returns events from today through the next two days.

**`cj_trending_keyword`** — `keyword_cn`, `keyword_en`, `rank`, `score`,
`as_of` (a **date**), `updated_at`. `unique (keyword_en, as_of)`.

**`cj_hot_stock`** — the individual-stock hot list.

`as_of` (a **timestamp**, the snapshot instant), `rank`, `symbol`, `name_cn`,
`name_en`, `market` (`cn`/`hk`/`us`), `heat`, `change_pct`, `price`, `source`,
`trend`, `url`, `updated_at`.

**`sector_intelligence`** — mirrored by the ORM so the drift guard covers it,
but read by no endpoint. It needs no rows.

### The views

**`cj_news_feed`** — the shape the API reads.

Unions `market_news_items` (left-joined to `cj_news_meta` and
`market_signals`) with published `cj_editorial` rows, projecting both into
one row shape. Editorial rows get a **negative id**, which is how the API
tells an editorial article from a collected one.

**`cj_editorial_detail`** — published editorial rows only, with the summary
columns renamed to `lede_cn` / `lede_en`.

---

## Three conventions worth knowing

**Timestamps are naive UTC.** Every `timestamp` column is UTC without a
timezone. The one deliberate exception is `cj_editorial.published_at`, which
is Beijing local time by design — the editorial trigger stamps it with
`now() AT TIME ZONE 'Asia/Shanghai'`, and the views compare it against the
same expression. Treat them as two conventions, not one.

**Snapshots use `as_of`.** `cj_sector_heat` and `cj_trending_keyword` use a
`date`; `cj_hot_stock` uses a `timestamp`. The API reads `max(as_of)` first
and returns only that batch, so history accumulates without the API ever
seeing it. Write a new snapshot rather than updating the old one.

**The schema is owned by the writer.** This repository never writes to these
tables. If you add a column, change three things:

1. `docs/SCHEMA.sql`
2. `backend/caijing/models/`
3. `backend/tests/schema_snapshot.json`

CI applies the contract to a real PostgreSQL and checks the mirror against
it, so a change that misses one of the three fails the build.

---

## The demo dataset

`docs/samples/demo_data.sql` fills the schema with synthetic content:
60 headlines, 60 metadata rows, 30 signals, 15 flash items, 12 quotes, 11
sectors, 6 coins, 6 chains, 6 calendar entries, 10 keywords and 10 hot stocks.

Every value in it is invented. Instrument names are real because they are the
taxonomy the interface renders against; prices, moves, headlines and URLs are
not. Timestamps are relative to load time, so the `1h` / `24h` / `7d` windows
stay populated however long after loading you look at it.

The rules it is written against are in the file's own header, and they bind
any data you contribute.
