-- =============================================================================
-- CaiJing Today — synthetic demo data
-- =============================================================================
-- Load AFTER docs/SCHEMA.sql. This file is the fixture that makes a fresh
-- checkout runnable: it fills every panel in the UI with plausible, entirely
-- INVENTED content, so the API and the frontend can be exercised end to end.
--
--   psql -d your_db -f docs/samples/demo_data.sql
--
-- THE DATA IS FAKE. READ THIS BEFORE TRUSTING ANYTHING YOU SEE.
--
--   * Every headline, summary, signal, quote, price, index level, sector
--     move, economic-calendar entry, trending keyword and hot-stock rank in
--     this file is invented for the demo. None of it describes a real
--     company, instrument, market, institution or event.
--   * The instrument NAMES are real (沪深300, Bitcoin, the GICS sector
--     names, ...) because they are the taxonomy the UI renders against —
--     but every VALUE attached to them is fabricated. A price here is not a
--     price; a change here is not a change.
--   * URLs use the reserved `.invalid` TLD (RFC 2606), which can never
--     resolve. They exist so link rendering has something to point at.
--   * The demo content is prefixed 【示例】 / "[sample]" so a screenshot of a
--     running instance is never mistaken for real coverage.
--
-- WHY IT EXISTS. The upstream data collector is a separate component and is
-- not part of this repository. Shipping a public schema with no way to fill
-- it would mean a stranger clones this repo and sees empty panels. This file
-- closes that gap: schema + fixture = a working site.
--
-- HOUSE RULES (the file is written so these are mechanically checkable):
--   1. No real news content, no real commentary on real events.
--   2. No real market levels, no real percentage moves.
--   3. No real URLs and no real source_id values.
--   4. Source ids stay real (akshare_em_global, gdelt, ...) — they are the
--      published vocabulary the frontend renders against.
--   5. Every timestamp is relative to load time (now() - interval ...), never
--      a hard-coded date, so the "1h / 24h / 7d" windows stay populated.
--   6. Heat is a decreasing function of age, so the ranking is not flat.
--
-- LICENSE
--   Same as the rest of this repository (see LICENSE at the repository root).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. News — 60 items across three time windows, with their metadata.
-- -----------------------------------------------------------------------------
-- The set is deliberately spread so that each ranking window returns a
-- different slice: the first 6 items are under an hour old, the next 18 are
-- under a day old, and the rest are spread over six days.

-- 12 headline templates, cycled across the 60 items. Each carries the
-- taxonomy category and the signal type the classifier would infer.
CREATE TEMP VIEW demo_templates AS
SELECT * FROM (VALUES
    ( 1, '【示例】央行开展例行公开市场操作，流动性保持合理充裕',
        '[Sample] Central bank conducts routine open-market operation, liquidity stays ample',
        'macro', 'macro', 'CN', 'zh', 'akshare_em_global'),
    ( 2, '【示例】监管部门就市场准入新规公开征求意见',
        '[Sample] Regulator opens consultation on new market-access rules',
        'policy', 'regulatory', 'CN', 'zh', 'akshare_em_cjzc'),
    ( 3, '【示例】主要股指午后小幅走高，成交量与前一日基本持平',
        '[Sample] Main equity indexes edge higher in the afternoon on flat turnover',
        'equities', 'sector', 'CN', 'zh', 'akshare_em_global'),
    ( 4, '【示例】短端国债收益率曲线小幅下行，中长端维持震荡',
        '[Sample] Short-end government bond yields dip while the long end stays range-bound',
        'bonds', 'macro', 'CN', 'zh', 'rss'),
    ( 5, '【示例】人民币汇率中间价与前一日持平，在岸价波动有限',
        '[Sample] Yuan fixing unchanged from the prior day, onshore moves limited',
        'fx', 'macro', 'CN', 'zh', 'akshare_em_global'),
    ( 6, '【示例】原油期货窄幅整理，避险资产同步走强',
        '[Sample] Crude futures consolidate in a narrow range as havens firm',
        'commodities', 'commodity', 'CN', 'zh', 'rss'),
    ( 7, '[Sample] US index futures point to a mixed open ahead of the session',
        '[Sample] US index futures point to a mixed open ahead of the session',
        'us', 'earnings', 'US', 'en', 'gdelt'),
    ( 8, '[Sample] Chipmaker outlines next capital spending plan',
        '[Sample] Chipmaker outlines next capital spending plan',
        'tech', 'company', 'US', 'en', 'polygon'),
    ( 9, '[Sample] Retailer reports quarterly revenue growth above plan',
        '[Sample] Retailer reports quarterly revenue growth above plan',
        'companies', 'earnings', 'US', 'en', 'sec_edgar'),
    (10, '[Sample] Digital asset markets stay steady into the weekend',
        '[Sample] Digital asset markets stay steady into the weekend',
        'crypto', 'sector', 'US', 'en', 'gdelt'),
    (11, '[Sample] Homebuilder describes order books as steady',
        '[Sample] Homebuilder describes order books as steady',
        'realestate', 'company', 'US', 'en', 'polygon'),
    (12, '【示例】评论：读懂一份数据，需要先看它的口径',
        '[Sample] Column: reading a number starts with knowing how it was measured',
        'opinion', 'macro', 'CN', 'zh', 'rss')
) AS t(idx, title_cn, title_en, category, signal_type, region, language, source);

-- The 60 news rows. Timestamps are naive UTC, matching the schema contract.
CREATE TEMP VIEW demo_news AS
SELECT
    g                                                                   AS g,
    'sample-news-' || lpad(g::text, 3, '0')                              AS source_id,
    (now() AT TIME ZONE 'utc')
        - CASE
            WHEN g <=  6 THEN (g * interval '9 minutes')
            WHEN g <= 24 THEN (g * interval '45 minutes')
            ELSE             (g * interval '2.4 hours')
          END                                                             AS published_at,
    round((99.0 - (g * 1.15))::numeric, 1)::double precision             AS heat
FROM generate_series(1, 60) AS g;

WITH inserted AS (
    INSERT INTO public.market_news_items (
        source, source_id, title, summary, url,
        published_at, region, language, raw_sentiment, is_processed, created_at
    )
    SELECT
        t.source,
        n.source_id,
        CASE WHEN t.language = 'zh' THEN t.title_cn ELSE t.title_en END,
        CASE WHEN t.language = 'zh'
             THEN '本条内容为演示数据，用于展示界面与接口，不代表任何真实报道或市场信息。'
             ELSE 'This item is demo content used to exercise the UI and the API. It does not describe any real report or market event.'
        END,
        'https://demo.' || t.source || '.invalid/sample-news/' || n.source_id,
        n.published_at,
        t.region,
        t.language,
        round((((g % 9) - 4) / 10.0)::numeric, 2)::double precision,
        true,
        n.published_at
    FROM demo_news n
    JOIN demo_templates t ON t.idx = ((n.g - 1) % 12) + 1
    RETURNING id, source_id
)
INSERT INTO public.cj_news_meta (
    news_item_id, category, title_cn, title_en,
    summary_cn, summary_en, heat, is_flash, updated_at
)
SELECT
    ins.id,
    t.category,
    t.title_cn,
    t.title_en,
    CASE WHEN t.language = 'zh'
         THEN '本条内容为演示数据，用于展示界面与接口，不代表任何真实报道或市场信息。'
         ELSE 'This item is demo content used to exercise the UI and the API. It does not describe any real report or market event.'
    END,
    CASE WHEN t.language = 'zh'
         THEN 'This item is demo content used to exercise the UI and the API. It does not describe any real report or market event.'
         ELSE '本条内容为演示数据，用于展示界面与接口，不代表任何真实报道或市场信息。'
    END,
    n.heat,
    (n.g % 7) = 0,
    n.published_at
FROM inserted ins
JOIN demo_news n ON n.source_id = ins.source_id
JOIN demo_templates t ON t.idx = ((n.g - 1) % 12) + 1;

-- -----------------------------------------------------------------------------
-- 2. Signals — attached to every other item, so the feed has both rows with
--    and rows without an analysis attached.
-- -----------------------------------------------------------------------------
INSERT INTO public.market_signals (
    news_item_id, signal_type, sentiment, confidence, impact_horizon,
    regions, sectors_affected, symbols_mentioned, symbols_impacted,
    impact_direction, theme_tags, summary_en, summary_zh,
    processed_at, model_used
)
SELECT
    ins.id,
    t.signal_type,
    round((((n.g % 7) - 3) / 10.0)::numeric, 2)::double precision,
    round((0.35 + ((n.g % 6) * 0.1))::numeric, 2)::double precision,
    (ARRAY['1d', '1w', '1m', '3m'])[1 + (n.g % 4)],
    ARRAY[t.region],
    ARRAY[(ARRAY['Information Technology', 'Financials', 'Energy', 'Health Care', 'Industrials'])[1 + (n.g % 5)]],
    ARRAY[(ARRAY['DEMO-A', 'DEMO-B', 'DEMO-C'])[1 + (n.g % 3)]],
    ARRAY[(ARRAY['DEMO-A', 'DEMO-D'])[1 + (n.g % 2)]],
    ARRAY[(ARRAY['positive', 'negative', 'neutral'])[1 + (n.g % 3)]],
    ARRAY[(ARRAY['Demo Theme', 'Policy', 'Liquidity', 'Earnings'])[1 + (n.g % 4)]],
    'Demo signal summary. The classification below is synthetic and describes no real event.',
    '演示信号摘要。下列分类为合成数据，不描述任何真实事件。',
    n.published_at,
    'demo-classifier-v0'
FROM public.market_news_items ins
JOIN demo_news n ON n.source_id = ins.source_id
JOIN demo_templates t ON t.idx = ((n.g - 1) % 12) + 1
WHERE n.g % 2 = 0;

-- -----------------------------------------------------------------------------
-- 3. Flash — the 7×24 newswire.
-- -----------------------------------------------------------------------------
INSERT INTO public.cj_flash (
    published_at, text_cn, text_en, source, source_id, importance, url
)
SELECT
    (now() AT TIME ZONE 'utc') - (g * interval '17 minutes'),
    '【示例】快讯 ' || lpad(g::text, 2, '0') || '：一条用于演示的即时消息，不含真实信息。',
    '[Sample] Flash ' || lpad(g::text, 2, '0') || ': an instant-message placeholder for the demo, carrying no real information.',
    (ARRAY['cls', 'em', 'sina'])[1 + (g % 3)],
    'sample-flash-' || lpad(g::text, 3, '0'),
    1 + (g % 3),
    'https://demo.flash.invalid/sample-flash/' || lpad(g::text, 3, '0')
FROM generate_series(1, 15) AS g;

-- -----------------------------------------------------------------------------
-- 4. Market quotes — the ticker strip and the mini charts.
-- -----------------------------------------------------------------------------
-- show_in_ticker drives the scrolling strip; show_in_charts drives the
-- sparkline panels. The instrument names are real (the UI renders a symbol
-- vocabulary); the levels and moves are fabricated.
INSERT INTO public.cj_market_quote (
    symbol, name_cn, name_en, asset_class, value, change, direction,
    sparkline, show_in_ticker, show_in_charts, sort_order, updated_at
)
VALUES
    ('000001.SS',  '上证指数',   'SSE Composite',  'index',      '3,418.62', '+0.84%',  1,
        '[{"t":"1","v":3392.1},{"t":"2","v":3401.4},{"t":"3","v":3398.7},{"t":"4","v":3410.2},{"t":"5","v":3418.62}]'::jsonb,
        true, true, 1,  (now() AT TIME ZONE 'utc')),
    ('^HSI',      '恒生指数',   'Hang Seng',      'index',      '18,904.30', '-0.22%', -1,
        '[{"t":"1","v":18960.0},{"t":"2","v":18988.4},{"t":"3","v":18975.1},{"t":"4","v":18920.6},{"t":"5","v":18904.3}]'::jsonb,
        true, true, 2,  (now() AT TIME ZONE 'utc')),
    ('^IXIC',     '纳斯达克',   'Nasdaq',         'index',      '15,732.11', '+1.12%',  1,
        '[{"t":"1","v":15560.2},{"t":"2","v":15601.7},{"t":"3","v":15588.9},{"t":"4","v":15674.3},{"t":"5","v":15732.11}]'::jsonb,
        true, true, 3,  (now() AT TIME ZONE 'utc')),
    ('^GSPC',     '标普500',    'S&P 500',        'index',      '5,667.20', '+0.61%',  1,
        '[{"t":"1","v":5632.8},{"t":"2","v":5641.5},{"t":"3","v":5638.2},{"t":"4","v":5659.4},{"t":"5","v":5667.2}]'::jsonb,
        true, true, 4,  (now() AT TIME ZONE 'utc')),
    ('CNY=X',     '离岸人民币', 'CNH',            'fx',         '7.2418',    '+0.04%',  1,
        '[{"t":"1","v":7.2399},{"t":"2","v":7.2412},{"t":"3","v":7.2405},{"t":"4","v":7.2411},{"t":"5","v":7.2418}]'::jsonb,
        true, false, 5, (now() AT TIME ZONE 'utc')),
    ('GC=F',      '黄金',       'Gold',           'commodity',  '2,364.50',  '+0.38%',  1,
        '[{"t":"1","v":2355.4},{"t":"2","v":2360.1},{"t":"3","v":2358.8},{"t":"4","v":2362.0},{"t":"5","v":2364.5}]'::jsonb,
        true, false, 6, (now() AT TIME ZONE 'utc')),
    ('BZ=F',      '布伦特原油', 'Brent Crude',    'commodity',  '78.42',     '-0.55%', -1,
        '[{"t":"1","v":78.90},{"t":"2","v":78.71},{"t":"3","v":78.80},{"t":"4","v":78.55},{"t":"5","v":78.42}]'::jsonb,
        true, false, 7, (now() AT TIME ZONE 'utc')),
    ('BTC-USD',   '比特币',     'Bitcoin',        'crypto',     '61,240.00', '+1.90%',  1,
        '[{"t":"1","v":60110.0},{"t":"2","v":60580.0},{"t":"3","v":60420.0},{"t":"4","v":60890.0},{"t":"5","v":61240.0}]'::jsonb,
        true, false, 8, (now() AT TIME ZONE 'utc')),
    ('CN10Y',     '十年期国债', 'China 10Y',      'rate',       '1.8240%',   '-0.02%', -1,
        '[{"t":"1","v":1.836},{"t":"2","v":1.831},{"t":"3","v":1.828},{"t":"4","v":1.826},{"t":"5","v":1.824}]'::jsonb,
        true, false, 9, (now() AT TIME ZONE 'utc')),
    ('^N225',     '日经225',    'Nikkei 225',     'index',      '38,120.44', '+0.47%',  1,
        '[{"t":"1","v":37940.0},{"t":"2","v":38010.0},{"t":"3","v":37985.0},{"t":"4","v":38060.0},{"t":"5","v":38120.44}]'::jsonb,
        false, false, 10, (now() AT TIME ZONE 'utc')),
    ('EURUSD',    '欧元美元',   'EUR/USD',        'fx',         '1.0832',    '+0.09%',  1,
        '[{"t":"1","v":1.0821},{"t":"2","v":1.0826},{"t":"3","v":1.0824},{"t":"4","v":1.0830},{"t":"5","v":1.0832}]'::jsonb,
        false, false, 11, (now() AT TIME ZONE 'utc')),
    ('ETH-USD',   '以太坊',     'Ethereum',       'crypto',     '2,940.55',  '-0.76%', -1,
        '[{"t":"1","v":2962.8},{"t":"2","v":2951.0},{"t":"3","v":2958.4},{"t":"4","v":2946.2},{"t":"5","v":2940.55}]'::jsonb,
        false, false, 12, (now() AT TIME ZONE 'utc'));

-- -----------------------------------------------------------------------------
-- 5. Sector heat — one snapshot for today. The sector names are the real
--    GICS vocabulary; the moves and inflows are fabricated.
-- -----------------------------------------------------------------------------
INSERT INTO public.cj_sector_heat (
    name_cn, name_en, change_pct, net_inflow, region, sort_order, as_of, updated_at
)
VALUES
    ('信息技术',   'Information Technology',  1.42,  18.60, 'CN',  1, current_date, (now() AT TIME ZONE 'utc')),
    ('金融',       'Financials',              0.88,  12.35, 'CN',  2, current_date, (now() AT TIME ZONE 'utc')),
    ('工业',       'Industrials',             0.53,   6.20, 'CN',  3, current_date, (now() AT TIME ZONE 'utc')),
    ('医疗保健',   'Health Care',            -0.21,  -3.85, 'CN',  4, current_date, (now() AT TIME ZONE 'utc')),
    ('能源',       'Energy',                  1.97,   9.44, 'CN',  5, current_date, (now() AT TIME ZONE 'utc')),
    ('材料',       'Materials',                0.34,   2.10, 'CN',  6, current_date, (now() AT TIME ZONE 'utc')),
    ('可选消费',   'Consumer Discretionary', -0.94,  -7.12, 'CN',  7, current_date, (now() AT TIME ZONE 'utc')),
    ('日常消费',   'Consumer Staples',        0.12,   1.05, 'CN',  8, current_date, (now() AT TIME ZONE 'utc')),
    ('公用事业',   'Utilities',              -0.47,  -2.60, 'CN',  9, current_date, (now() AT TIME ZONE 'utc')),
    ('房地产',     'Real Estate',             0.71,   4.48, 'CN', 10, current_date, (now() AT TIME ZONE 'utc')),
    ('通信服务',   'Communication Services',  1.05,   7.93, 'CN', 11, current_date, (now() AT TIME ZONE 'utc'));

-- -----------------------------------------------------------------------------
-- 6. Market metrics — the crypto header stats.
-- -----------------------------------------------------------------------------
INSERT INTO public.cj_market_metric (
    metric_key, "group", key_cn, key_en, value_cn, value_en, direction, sort_order, updated_at
)
VALUES
    ('crypto_total_cap', 'crypto', '总市值',   'Total cap',  '1.82 万亿美元', '$1.82T',  1, 1, (now() AT TIME ZONE 'utc')),
    ('fear_greed',       'crypto', '恐惧贪婪指数', 'Fear & Greed', '62',         '62',     0, 2, (now() AT TIME ZONE 'utc'));

-- -----------------------------------------------------------------------------
-- 7. Crypto — coins, chains and (deliberately empty) new listings.
-- -----------------------------------------------------------------------------
-- The coin and chain NAMES are real (the UI renders this vocabulary); every
-- price, TVL figure and gas value is fabricated.
INSERT INTO public.cj_crypto_coin (
    symbol, name_cn, name_en, price, change_pct, color, sort_order, updated_at
)
VALUES
    ('BTC',    '比特币',   'Bitcoin',     '61,240.00',  1.90, '#F7931A', 1, (now() AT TIME ZONE 'utc')),
    ('ETH',    '以太坊',   'Ethereum',    '2,940.55',  -0.76, '#627EEA', 2, (now() AT TIME ZONE 'utc')),
    ('SOL',    '索拉纳',   'Solana',      '143.28',     2.34, '#9945FF', 3, (now() AT TIME ZONE 'utc')),
    ('BNB',    '币安币',   'BNB',         '592.40',     0.45, '#F3BA2F', 4, (now() AT TIME ZONE 'utc')),
    ('XRP',    '瑞波币',   'XRP',         '0.6182',    -1.12, '#23292F', 5, (now() AT TIME ZONE 'utc')),
    ('DOGE',   '狗狗币',   'Dogecoin',    '0.1284',     1.67, '#C2A633', 6, (now() AT TIME ZONE 'utc'));

INSERT INTO public.cj_crypto_chain (
    name_cn, name_en, tvl, gas, change_pct, color, sort_order, updated_at
)
VALUES
    ('以太坊',   'Ethereum',  '78.4B',  '3.2 Gwei',  -0.76, '#627EEA', 1, (now() AT TIME ZONE 'utc')),
    ('索拉纳',   'Solana',    '42.1B',  '0.001 Gwei', 2.34, '#9945FF', 2, (now() AT TIME ZONE 'utc')),
    ('比特币',   'Bitcoin',   '61.2B',  '12 Gwei',   1.90, '#F7931A', 3, (now() AT TIME ZONE 'utc')),
    ('BNB Chain','BNB Chain','18.7B',  '0.05 Gwei', 0.45, '#F3BA2F', 4, (now() AT TIME ZONE 'utc')),
    ('Polygon',  'Polygon',    '9.3B',   '0.03 Gwei',-1.08, '#8247E5', 5, (now() AT TIME ZONE 'utc')),
    ('Arbitrum','Arbitrum',   '6.1B',   '0.01 Gwei', 0.92, '#28A0F0', 6, (now() AT TIME ZONE 'utc'));

-- cj_crypto_listing is intentionally left empty: the "new listings" panel
-- degrades to not showing, which is the correct behaviour for a table with
-- no rows.

-- -----------------------------------------------------------------------------
-- 8. Economic calendar — today and the two days after it.
-- -----------------------------------------------------------------------------
-- The event NAMES are invented. A real economic calendar is a record of
-- scheduled releases; inventing one that named a real release would be
-- publishing false information, so every entry here is a placeholder with a
-- name that cannot be mistaken for one.
INSERT INTO public.cj_econ_event (
    event_date, event_time, importance, name_cn, name_en,
    forecast, previous, actual, country, updated_at
)
SELECT
    current_date + (g - 1),
    (ARRAY['09:30', '10:00', '14:00', '16:30', '20:30'])[1 + (g % 5)],
    1 + (g % 3),
    '【示例】演示经济日历条目 ' || lpad(g::text, 2, '0'),
    '[Sample] Demo calendar entry ' || lpad(g::text, 2, '0'),
    '—',
    '—',
    '',
    (ARRAY['CN', 'US', 'EU'])[1 + (g % 3)],
    (now() AT TIME ZONE 'utc')
FROM generate_series(1, 6) AS g;

-- -----------------------------------------------------------------------------
-- 9. Trending keywords — one snapshot for today.
-- -----------------------------------------------------------------------------
INSERT INTO public.cj_trending_keyword (
    keyword_cn, keyword_en, rank, score, as_of, updated_at
)
VALUES
    ('【示例】热词一',   '[Sample] Keyword One',   1, 98.4, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词二',   '[Sample] Keyword Two',   2, 94.1, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词三',   '[Sample] Keyword Three', 3, 90.7, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词四',   '[Sample] Keyword Four',  4, 86.2, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词五',   '[Sample] Keyword Five',  5, 81.9, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词六',   '[Sample] Keyword Six',   6, 77.3, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词七',   '[Sample] Keyword Seven', 7, 72.8, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词八',   '[Sample] Keyword Eight', 8, 68.5, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词九',   '[Sample] Keyword Nine',  9, 64.0, current_date, (now() AT TIME ZONE 'utc')),
    ('【示例】热词十',   '[Sample] Keyword Ten',  10, 59.6, current_date, (now() AT TIME ZONE 'utc'));

-- -----------------------------------------------------------------------------
-- 10. Hot stocks — one snapshot batch, ranked.
-- -----------------------------------------------------------------------------
-- The symbols are placeholders (DEMO-001 …), never real tickers: a real
-- ticker on a fabricated heat score reads as investment advice.
INSERT INTO public.cj_hot_stock (
    as_of, rank, symbol, name_cn, name_en, market,
    heat, change_pct, price, source, trend, url, updated_at
)
SELECT
    (now() AT TIME ZONE 'utc'),
    g,
    'DEMO-' || lpad(g::text, 3, '0'),
    '【示例】演示标的 ' || lpad(g::text, 2, '0'),
    '[Sample] Demo Instrument ' || lpad(g::text, 2, '0'),
    (ARRAY['cn', 'hk', 'us'])[1 + (g % 3)],
    round((92.0 - (g * 3.1))::numeric, 1)::double precision,
    round((((g % 7) - 3) / 10.0)::numeric, 2)::double precision,
    round((100.0 + (g * 4.7))::numeric, 2)::text,
    'demo',
    (g % 3) - 1,
    'https://demo.hotstock.invalid/DEMO-' || lpad(g::text, 3, '0'),
    (now() AT TIME ZONE 'utc')
FROM generate_series(1, 10) AS g;

-- -----------------------------------------------------------------------------
-- 11. Editorial and sector intelligence — intentionally left empty.
-- -----------------------------------------------------------------------------
-- cj_editorial holds hand-written articles. There is no honest way to
-- fabricate one, so the table stays empty and the editorial panel simply
-- does not render. sector_intelligence is mirrored by the ORM but read by no
-- endpoint, so it needs no rows either.

COMMIT;

-- =============================================================================
-- Sanity check — every panel should report a non-zero count.
--   psql -d your_db -f docs/samples/demo_data.sql
--
-- The table names are schema-qualified so this works no matter what
-- search_path the session happens to carry.
-- =============================================================================
SELECT 'market_news_items' AS table_name, count(*) FROM public.market_news_items
UNION ALL SELECT 'cj_news_meta',         count(*) FROM public.cj_news_meta
UNION ALL SELECT 'market_signals',       count(*) FROM public.market_signals
UNION ALL SELECT 'cj_flash',             count(*) FROM public.cj_flash
UNION ALL SELECT 'cj_market_quote',      count(*) FROM public.cj_market_quote
UNION ALL SELECT 'cj_sector_heat',       count(*) FROM public.cj_sector_heat
UNION ALL SELECT 'cj_market_metric',     count(*) FROM public.cj_market_metric
UNION ALL SELECT 'cj_crypto_coin',       count(*) FROM public.cj_crypto_coin
UNION ALL SELECT 'cj_crypto_chain',      count(*) FROM public.cj_crypto_chain
UNION ALL SELECT 'cj_crypto_listing',    count(*) FROM public.cj_crypto_listing
UNION ALL SELECT 'cj_econ_event',        count(*) FROM public.cj_econ_event
UNION ALL SELECT 'cj_trending_keyword',  count(*) FROM public.cj_trending_keyword
UNION ALL SELECT 'cj_hot_stock',         count(*) FROM public.cj_hot_stock
UNION ALL SELECT 'cj_editorial',         count(*) FROM public.cj_editorial
ORDER BY 1;
