# Data sources

## What this repository contains

A schema and a reader. That is all.

| | In this repository? |
|---|---|
| The database schema the API reads | ✅ [`docs/SCHEMA.sql`](SCHEMA.sql) |
| A synthetic demo dataset | ✅ [`docs/samples/demo_data.sql`](samples/demo_data.sql) |
| A collector that fetches real news and quotes | ❌ |
| A snapshot of real market data | ❌ |
| Any real headline, quote or price | ❌ |

Nothing in this repository reaches the internet to fetch a headline. The API
reads the database you give it.

## The demo dataset is fake, and says so

Every row in `docs/samples/demo_data.sql` is invented:

- **No real headlines.** The titles are placeholders, prefixed 【示例】 /
  `[sample]`.
- **No real prices.** Index levels, percentage moves, crypto prices, TVL
  figures, gas values and fund flows are all fabricated.
- **No real economic calendar.** Inventing an entry that named a real
  scheduled release would be publishing false information, so every calendar
  entry is a placeholder.
- **No real URLs.** Every link uses the reserved `.invalid` TLD (RFC 2606),
  which can never resolve.
- **No real tickers.** The hot-stock list uses `DEMO-001` … `DEMO-010`.
  A real ticker on a fabricated heat score reads as investment advice.

What *is* real is the vocabulary: the instrument names (沪深300, Bitcoin), the
GICS sector names, the twelve category ids and the source ids. Those are the
labels the interface renders against, and the interface would not work
without them.

**If you take a screenshot of a running instance, the content in it is not
real.** That is deliberate, and it is why every headline carries a visible
marker.

## The source ids

`market_news_items.source` carries the collector's raw source id. The ids the
front end knows how to render are:

| Id | Displayed as (Chinese) | Displayed as (English) |
|---|---|---|
| `akshare_em_global` | 东方财富·全球快讯 | Eastmoney Global |
| `akshare_em_cjzc` | 东方财富·财经早餐 | Eastmoney Breakfast |
| `rss` | 财经 RSS 聚合 | Finance RSS Feeds |
| `polygon` | Polygon.io | Polygon.io |
| `gdelt` | GDELT 全球新闻 | GDELT Global News |
| `sec_edgar` | SEC EDGAR 公告 | SEC EDGAR Filings |

The registry lives in `frontend/src/lib/sources.ts`. An unknown id falls back
to the id itself, so a collector that writes new ids still renders — the
labels just do not appear until the registry is updated.

The flash feed uses a different vocabulary (`cls`, `em`, `sina`); the API does
not expose a source for flash items, so those ids are not rendered.

## Plugging in your own collector

This is the intended extension point. Write a component that inserts into
the tables in `docs/SCHEMA.sql`, and the API and the UI will serve it with no
code changes.

The contract the collector has to honour:

1. **`published_at` is naive UTC.** Everywhere, except
   `cj_editorial.published_at`.
2. **`cj_news_meta.news_item_id` is unique.** One metadata row per headline.
3. **`market_signals.news_item_id` is unique.** At most one analysis per
   headline. A headline without a signal is normal — the API handles it.
4. **Snapshot tables get a new `as_of`, not an update.** The API reads
   `max(as_of)` and returns only that batch.
5. **The category, if you set one, must be one of the twelve ids** in
   `backend/caijing/taxonomy.py`. If you leave it null, the API derives one.
6. **`cj_news_meta.heat` drives the ranking.** Leave it null and the API
   computes a score from the publication time, the signal's confidence and
   the absolute value of its sentiment.

The `cj_editorial` table is for hand-written articles. It is optional — the
editorial panel simply does not render when the table is empty, which is
exactly what the demo dataset does.

## What you owe the sources

**This is the part that matters when you connect real data.**

The headlines, summaries and market data that a collector retrieves belong to
the organisations that published them. Each has its own terms, and they
differ: a financial wire service, a free public-data portal and a market-data
vendor do not grant the same rights.

If you connect a collector of your own:

- **You** are responsible for complying with the terms of every source it
  reads. Nothing in this repository grants you any right to real financial
  news content, and this project is not a party to your agreement with those
  sources.
- Redistributing a database built by a collector puts the same obligations on
  you as publishing the content itself.
- Attribution is not the same as permission. A source that allows linking
  does not necessarily allow redistribution.

The MIT licence in this repository covers **the code**. It says nothing about
the data you put into the database.

## Attribution

The interface credits its sources in the footer, from the same registry the
news cards use. If you add a source, add it to `frontend/src/lib/sources.ts`
so it is credited too.
