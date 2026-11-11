-- =============================================================================
-- CaiJing Today — read-side schema contract
-- =============================================================================
-- The tables, views, sequences, indexes and constraints that CaiJing Today
-- reads. This is the CONTRACT: the collector that writes these tables is a
-- separate project, and nothing here is required to run the site — only to
-- serve real data.
--
-- SCOPE
--   15 tables   market_news_items, market_signals, sector_intelligence,
--                cj_news_meta, cj_flash, cj_editorial, cj_hot_stock,
--                cj_sector_heat, cj_market_quote, cj_market_metric,
--                cj_econ_event, cj_trending_keyword, cj_crypto_coin,
--                cj_crypto_chain, cj_crypto_listing
--    2 views    cj_news_feed, cj_editorial_detail
--   15 sequences, 17 indexes, 28 constraints, 1 trigger function
--
--   `cj_editorial` is included ONLY because `cj_news_feed` and
--   `cj_editorial_detail` are built on it. Everything else outside this list
--   belongs to the writer side and is deliberately absent.
--
-- HOW TO APPLY
--   psql -d your_db -f docs/SCHEMA.sql
--   Requires PostgreSQL 12+ (verified on 17). No extensions needed: the only
--   procedural language used is plpgsql, which ships enabled by default.
--   The DDL uses no version-specific syntax (no identity columns, no NULLS
--   NOT DISTINCT, no MERGE).
--
--   The DDL below is verbatim `pg_dump --schema-only` output for those
--   objects, with owner/privilege statements and pg_dump's psql-private
--   \restrict directives removed so the file applies on any client.
--
--   To populate it with synthetic demo content, apply
--   docs/samples/demo_data.sql afterwards.
--
-- ONE TIMESTAMP QUIRK, ON PURPOSE
--   Every timestamp column in this schema is naive UTC — except
--   `cj_editorial.published_at`, which is Beijing local time by design
--   (see `cj_stamp_published_bj` below, and the view filters that compare it
--   against `now() AT TIME ZONE 'Asia/Shanghai'`). The collected news rows
--   are UTC; the hand-authored editorial rows are not. Treat them as two
--   conventions, not one.
--
-- LICENSE
--   Same as the rest of this repository (see LICENSE at the repository root).
-- =============================================================================

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cj_crypto_chain; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_crypto_chain (
    id bigint NOT NULL,
    name_cn character varying(64) DEFAULT ''::character varying NOT NULL,
    name_en character varying(64) NOT NULL,
    tvl character varying(16) DEFAULT ''::character varying NOT NULL,
    gas character varying(16) DEFAULT ''::character varying NOT NULL,
    change_pct double precision DEFAULT '0'::double precision NOT NULL,
    color character varying(9) DEFAULT '#888888'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_crypto_chain_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_crypto_chain_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_crypto_chain_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_crypto_chain_id_seq OWNED BY public.cj_crypto_chain.id;

--
-- Name: cj_crypto_coin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_crypto_coin (
    id bigint NOT NULL,
    symbol character varying(16) NOT NULL,
    name_cn character varying(64) DEFAULT ''::character varying NOT NULL,
    name_en character varying(64) DEFAULT ''::character varying NOT NULL,
    price character varying(32) DEFAULT ''::character varying NOT NULL,
    change_pct double precision DEFAULT '0'::double precision NOT NULL,
    color character varying(9) DEFAULT '#888888'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_crypto_coin_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_crypto_coin_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_crypto_coin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_crypto_coin_id_seq OWNED BY public.cj_crypto_coin.id;

--
-- Name: cj_crypto_listing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_crypto_listing (
    id bigint NOT NULL,
    symbol character varying(16) NOT NULL,
    venue_cn character varying(64) DEFAULT ''::character varying NOT NULL,
    venue_en character varying(64) DEFAULT ''::character varying NOT NULL,
    listed_date character varying(10) DEFAULT ''::character varying NOT NULL,
    change_pct double precision DEFAULT '0'::double precision NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_crypto_listing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_crypto_listing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_crypto_listing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_crypto_listing_id_seq OWNED BY public.cj_crypto_listing.id;

--
-- Name: cj_econ_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_econ_event (
    id bigint NOT NULL,
    event_date date NOT NULL,
    event_time character varying(8) DEFAULT ''::character varying NOT NULL,
    importance smallint DEFAULT '1'::smallint NOT NULL,
    name_cn character varying(128) DEFAULT ''::character varying NOT NULL,
    name_en character varying(128) DEFAULT ''::character varying NOT NULL,
    forecast character varying(32) DEFAULT '—'::character varying NOT NULL,
    previous character varying(32) DEFAULT ''::character varying NOT NULL,
    actual character varying(32) DEFAULT ''::character varying NOT NULL,
    country character varying(8) DEFAULT ''::character varying NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_econ_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_econ_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_econ_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_econ_event_id_seq OWNED BY public.cj_econ_event.id;

--
-- Name: cj_editorial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_editorial (
    id bigint NOT NULL,
    kind character varying DEFAULT 'news'::character varying NOT NULL,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    category character varying NOT NULL,
    title_cn character varying,
    title_en character varying,
    summary_cn text,
    summary_en text,
    body_cn text,
    body_en text,
    hero_image text,
    source_name character varying DEFAULT '财经今日'::character varying,
    author_cn character varying,
    author_en character varying,
    url text,
    tags character varying[],
    heat double precision,
    is_featured boolean DEFAULT false NOT NULL,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    updated_at timestamp without time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL
);

--
-- Name: cj_editorial_detail; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.cj_editorial_detail AS
 SELECT (- id) AS id,
    kind,
    category,
    title_cn,
    title_en,
    summary_cn AS lede_cn,
    summary_en AS lede_en,
    body_cn,
    body_en,
    hero_image,
    source_name,
    author_cn,
    author_en,
    url,
    tags,
    heat,
    is_featured,
    published_at
   FROM public.cj_editorial e
  WHERE (((status)::text = 'published'::text) AND (published_at IS NOT NULL) AND (published_at <= (now() AT TIME ZONE 'Asia/Shanghai'::text)));

--
-- Name: cj_editorial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_editorial_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_editorial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_editorial_id_seq OWNED BY public.cj_editorial.id;

--
-- Name: cj_flash; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_flash (
    id bigint NOT NULL,
    published_at timestamp without time zone NOT NULL,
    text_cn text,
    text_en text,
    source character varying(50) NOT NULL,
    source_id character varying(255),
    importance smallint DEFAULT '1'::smallint NOT NULL,
    url text
);

--
-- Name: cj_flash_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_flash_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_flash_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_flash_id_seq OWNED BY public.cj_flash.id;

--
-- Name: cj_hot_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_hot_stock (
    id bigint NOT NULL,
    as_of timestamp without time zone NOT NULL,
    rank integer NOT NULL,
    symbol character varying NOT NULL,
    name_cn character varying,
    name_en character varying,
    market character varying,
    heat double precision,
    change_pct double precision,
    price character varying,
    source character varying,
    trend smallint,
    url text,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_hot_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_hot_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_hot_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_hot_stock_id_seq OWNED BY public.cj_hot_stock.id;

--
-- Name: cj_market_metric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_market_metric (
    id bigint NOT NULL,
    metric_key character varying(48) NOT NULL,
    "group" character varying(24) DEFAULT ''::character varying NOT NULL,
    key_cn character varying(48) DEFAULT ''::character varying NOT NULL,
    key_en character varying(48) DEFAULT ''::character varying NOT NULL,
    value_cn character varying(48) DEFAULT ''::character varying NOT NULL,
    value_en character varying(48) DEFAULT ''::character varying NOT NULL,
    direction smallint DEFAULT '0'::smallint NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_market_metric_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_market_metric_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_market_metric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_market_metric_id_seq OWNED BY public.cj_market_metric.id;

--
-- Name: cj_market_quote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_market_quote (
    id bigint NOT NULL,
    symbol character varying(32) NOT NULL,
    name_cn character varying(64) NOT NULL,
    name_en character varying(64) NOT NULL,
    asset_class character varying(16) NOT NULL,
    value character varying(32) NOT NULL,
    change character varying(32) DEFAULT ''::character varying NOT NULL,
    direction smallint DEFAULT '0'::smallint NOT NULL,
    sparkline jsonb,
    show_in_ticker boolean DEFAULT true NOT NULL,
    show_in_charts boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_market_quote_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_market_quote_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_market_quote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_market_quote_id_seq OWNED BY public.cj_market_quote.id;

--
-- Name: cj_news_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_news_meta (
    id bigint NOT NULL,
    news_item_id bigint NOT NULL,
    category character varying(20) NOT NULL,
    title_cn text,
    title_en text,
    summary_cn text,
    summary_en text,
    heat double precision DEFAULT '0'::double precision NOT NULL,
    is_flash boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: market_news_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_news_items (
    id bigint NOT NULL,
    source character varying(50) NOT NULL,
    source_id character varying(255),
    title text NOT NULL,
    summary text,
    url text,
    published_at timestamp without time zone NOT NULL,
    region character varying(10),
    language character varying(5) DEFAULT 'en'::character varying NOT NULL,
    raw_sentiment double precision,
    is_processed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: market_signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_signals (
    id bigint NOT NULL,
    news_item_id bigint NOT NULL,
    signal_type character varying(30) NOT NULL,
    sentiment double precision,
    confidence double precision,
    impact_horizon character varying(10),
    regions character varying(10)[],
    sectors_affected character varying(50)[],
    symbols_mentioned character varying(20)[],
    symbols_impacted character varying(20)[],
    impact_direction character varying(10)[],
    theme_tags character varying(100)[],
    summary_en text,
    summary_zh text,
    processed_at timestamp without time zone DEFAULT now() NOT NULL,
    model_used character varying(50)
);

--
-- Name: cj_news_feed; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.cj_news_feed AS
 SELECT n.id,
    n.source,
    n.region,
    n.language,
    n.url,
    n.published_at,
    n.title AS raw_title,
    n.summary AS raw_summary,
    m.category,
    m.title_cn,
    m.title_en,
    m.summary_cn,
    m.summary_en,
    m.heat,
    m.is_flash,
    s.signal_type,
    s.sectors_affected,
    s.regions,
    s.theme_tags,
    s.confidence,
    s.sentiment,
    s.summary_zh AS sig_summary_cn,
    s.summary_en AS sig_summary_en
   FROM ((public.market_news_items n
     LEFT JOIN public.cj_news_meta m ON ((m.news_item_id = n.id)))
     LEFT JOIN public.market_signals s ON ((s.news_item_id = n.id)))
UNION ALL
 SELECT (- e.id) AS id,
    e.source_name AS source,
    NULL::character varying AS region,
    NULL::character varying AS language,
    e.url,
    e.published_at,
    COALESCE(e.title_cn, e.title_en) AS raw_title,
    COALESCE(e.summary_cn, e.summary_en) AS raw_summary,
    e.category,
    e.title_cn,
    e.title_en,
    e.summary_cn,
    e.summary_en,
    COALESCE(e.heat, (50)::double precision) AS heat,
    false AS is_flash,
    NULL::character varying AS signal_type,
    NULL::character varying[] AS sectors_affected,
    NULL::character varying[] AS regions,
    e.tags AS theme_tags,
    NULL::double precision AS confidence,
    NULL::double precision AS sentiment,
    NULL::text AS sig_summary_cn,
    NULL::text AS sig_summary_en
   FROM public.cj_editorial e
  WHERE (((e.status)::text = 'published'::text) AND (e.published_at IS NOT NULL) AND (e.published_at <= (now() AT TIME ZONE 'Asia/Shanghai'::text)));

--
-- Name: cj_news_meta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_news_meta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_news_meta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_news_meta_id_seq OWNED BY public.cj_news_meta.id;

--
-- Name: cj_sector_heat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_sector_heat (
    id bigint NOT NULL,
    name_cn character varying(64) NOT NULL,
    name_en character varying(64) NOT NULL,
    change_pct double precision DEFAULT '0'::double precision NOT NULL,
    net_inflow double precision DEFAULT '0'::double precision NOT NULL,
    region character varying(10) DEFAULT 'CN'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    as_of date NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_sector_heat_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_sector_heat_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_sector_heat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_sector_heat_id_seq OWNED BY public.cj_sector_heat.id;

--
-- Name: cj_trending_keyword; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cj_trending_keyword (
    id bigint NOT NULL,
    keyword_cn character varying(64) DEFAULT ''::character varying NOT NULL,
    keyword_en character varying(64) DEFAULT ''::character varying NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    score double precision DEFAULT '0'::double precision NOT NULL,
    as_of date NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);

--
-- Name: cj_trending_keyword_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cj_trending_keyword_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: cj_trending_keyword_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cj_trending_keyword_id_seq OWNED BY public.cj_trending_keyword.id;

--
-- Name: market_news_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_news_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: market_news_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_news_items_id_seq OWNED BY public.market_news_items.id;

--
-- Name: market_signals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_signals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: market_signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_signals_id_seq OWNED BY public.market_signals.id;

--
-- Name: sector_intelligence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sector_intelligence (
    id bigint NOT NULL,
    sector character varying(50) NOT NULL,
    region character varying(10) NOT NULL,
    intel_date date NOT NULL,
    signal_count integer DEFAULT 0 NOT NULL,
    avg_sentiment double precision,
    bullish_count integer DEFAULT 0 NOT NULL,
    bearish_count integer DEFAULT 0 NOT NULL,
    top_themes character varying(100)[],
    narrative text,
    key_signal_ids bigint[],
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: sector_intelligence_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sector_intelligence_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: sector_intelligence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sector_intelligence_id_seq OWNED BY public.sector_intelligence.id;

--
-- Name: cj_crypto_chain id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_chain ALTER COLUMN id SET DEFAULT nextval('public.cj_crypto_chain_id_seq'::regclass);

--
-- Name: cj_crypto_coin id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_coin ALTER COLUMN id SET DEFAULT nextval('public.cj_crypto_coin_id_seq'::regclass);

--
-- Name: cj_crypto_listing id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_listing ALTER COLUMN id SET DEFAULT nextval('public.cj_crypto_listing_id_seq'::regclass);

--
-- Name: cj_econ_event id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_econ_event ALTER COLUMN id SET DEFAULT nextval('public.cj_econ_event_id_seq'::regclass);

--
-- Name: cj_editorial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_editorial ALTER COLUMN id SET DEFAULT nextval('public.cj_editorial_id_seq'::regclass);

--
-- Name: cj_flash id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_flash ALTER COLUMN id SET DEFAULT nextval('public.cj_flash_id_seq'::regclass);

--
-- Name: cj_hot_stock id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_hot_stock ALTER COLUMN id SET DEFAULT nextval('public.cj_hot_stock_id_seq'::regclass);

--
-- Name: cj_market_metric id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_market_metric ALTER COLUMN id SET DEFAULT nextval('public.cj_market_metric_id_seq'::regclass);

--
-- Name: cj_market_quote id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_market_quote ALTER COLUMN id SET DEFAULT nextval('public.cj_market_quote_id_seq'::regclass);

--
-- Name: cj_news_meta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_news_meta ALTER COLUMN id SET DEFAULT nextval('public.cj_news_meta_id_seq'::regclass);

--
-- Name: cj_sector_heat id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_sector_heat ALTER COLUMN id SET DEFAULT nextval('public.cj_sector_heat_id_seq'::regclass);

--
-- Name: cj_trending_keyword id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_trending_keyword ALTER COLUMN id SET DEFAULT nextval('public.cj_trending_keyword_id_seq'::regclass);

--
-- Name: market_news_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_news_items ALTER COLUMN id SET DEFAULT nextval('public.market_news_items_id_seq'::regclass);

--
-- Name: market_signals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_signals ALTER COLUMN id SET DEFAULT nextval('public.market_signals_id_seq'::regclass);

--
-- Name: sector_intelligence id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sector_intelligence ALTER COLUMN id SET DEFAULT nextval('public.sector_intelligence_id_seq'::regclass);

--
-- Name: cj_crypto_chain cj_crypto_chain_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_chain
    ADD CONSTRAINT cj_crypto_chain_pkey PRIMARY KEY (id);

--
-- Name: cj_crypto_coin cj_crypto_coin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_coin
    ADD CONSTRAINT cj_crypto_coin_pkey PRIMARY KEY (id);

--
-- Name: cj_crypto_listing cj_crypto_listing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_listing
    ADD CONSTRAINT cj_crypto_listing_pkey PRIMARY KEY (id);

--
-- Name: cj_econ_event cj_econ_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_econ_event
    ADD CONSTRAINT cj_econ_event_pkey PRIMARY KEY (id);

--
-- Name: cj_editorial cj_editorial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_editorial
    ADD CONSTRAINT cj_editorial_pkey PRIMARY KEY (id);

--
-- Name: cj_flash cj_flash_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_flash
    ADD CONSTRAINT cj_flash_pkey PRIMARY KEY (id);

--
-- Name: cj_hot_stock cj_hot_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_hot_stock
    ADD CONSTRAINT cj_hot_stock_pkey PRIMARY KEY (id);

--
-- Name: cj_market_metric cj_market_metric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_market_metric
    ADD CONSTRAINT cj_market_metric_pkey PRIMARY KEY (id);

--
-- Name: cj_market_quote cj_market_quote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_market_quote
    ADD CONSTRAINT cj_market_quote_pkey PRIMARY KEY (id);

--
-- Name: cj_news_meta cj_news_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_news_meta
    ADD CONSTRAINT cj_news_meta_pkey PRIMARY KEY (id);

--
-- Name: cj_sector_heat cj_sector_heat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_sector_heat
    ADD CONSTRAINT cj_sector_heat_pkey PRIMARY KEY (id);

--
-- Name: cj_trending_keyword cj_trending_keyword_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_trending_keyword
    ADD CONSTRAINT cj_trending_keyword_pkey PRIMARY KEY (id);

--
-- Name: market_news_items market_news_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_news_items
    ADD CONSTRAINT market_news_items_pkey PRIMARY KEY (id);

--
-- Name: market_signals market_signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_signals
    ADD CONSTRAINT market_signals_pkey PRIMARY KEY (id);

--
-- Name: sector_intelligence sector_intelligence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sector_intelligence
    ADD CONSTRAINT sector_intelligence_pkey PRIMARY KEY (id);

--
-- Name: cj_crypto_chain uq_cj_chain_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_chain
    ADD CONSTRAINT uq_cj_chain_name UNIQUE (name_en);

--
-- Name: cj_crypto_coin uq_cj_coin_symbol; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_coin
    ADD CONSTRAINT uq_cj_coin_symbol UNIQUE (symbol);

--
-- Name: cj_econ_event uq_cj_econ_event; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_econ_event
    ADD CONSTRAINT uq_cj_econ_event UNIQUE (event_date, name_en, country);

--
-- Name: cj_flash uq_cj_flash_source; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_flash
    ADD CONSTRAINT uq_cj_flash_source UNIQUE (source, source_id);

--
-- Name: cj_trending_keyword uq_cj_kw_snapshot; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_trending_keyword
    ADD CONSTRAINT uq_cj_kw_snapshot UNIQUE (keyword_en, as_of);

--
-- Name: cj_crypto_listing uq_cj_listing; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_crypto_listing
    ADD CONSTRAINT uq_cj_listing UNIQUE (symbol, venue_en);

--
-- Name: cj_market_metric uq_cj_metric_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_market_metric
    ADD CONSTRAINT uq_cj_metric_key UNIQUE (metric_key);

--
-- Name: cj_news_meta uq_cj_news_meta_item; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_news_meta
    ADD CONSTRAINT uq_cj_news_meta_item UNIQUE (news_item_id);

--
-- Name: cj_market_quote uq_cj_quote_symbol; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_market_quote
    ADD CONSTRAINT uq_cj_quote_symbol UNIQUE (symbol);

--
-- Name: cj_sector_heat uq_cj_sector_snapshot; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cj_sector_heat
    ADD CONSTRAINT uq_cj_sector_snapshot UNIQUE (name_en, region, as_of);

--
-- Name: market_news_items uq_news_source_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_news_items
    ADD CONSTRAINT uq_news_source_id UNIQUE (source, source_id);

--
-- Name: sector_intelligence uq_sector_intel_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sector_intelligence
    ADD CONSTRAINT uq_sector_intel_date UNIQUE (sector, region, intel_date);

--
-- Name: market_signals uq_signal_news_item; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_signals
    ADD CONSTRAINT uq_signal_news_item UNIQUE (news_item_id);

--
-- Name: ix_cj_econ_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_econ_date ON public.cj_econ_event USING btree (event_date);

--
-- Name: ix_cj_editorial_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_editorial_category ON public.cj_editorial USING btree (category);

--
-- Name: ix_cj_editorial_status_pub; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_editorial_status_pub ON public.cj_editorial USING btree (status, published_at DESC);

--
-- Name: ix_cj_flash_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_flash_published ON public.cj_flash USING btree (published_at);

--
-- Name: ix_cj_hot_stock_as_of; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_hot_stock_as_of ON public.cj_hot_stock USING btree (as_of);

--
-- Name: ix_cj_hot_stock_as_of_rank; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_hot_stock_as_of_rank ON public.cj_hot_stock USING btree (as_of, rank);

--
-- Name: ix_cj_kw_asof; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_kw_asof ON public.cj_trending_keyword USING btree (as_of);

--
-- Name: ix_cj_market_quote_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_market_quote_updated_at ON public.cj_market_quote USING btree (updated_at);

--
-- Name: ix_cj_news_meta_cat_heat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_news_meta_cat_heat ON public.cj_news_meta USING btree (category, heat);

--
-- Name: ix_cj_news_meta_news_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_news_meta_news_item_id ON public.cj_news_meta USING btree (news_item_id);

--
-- Name: ix_cj_sector_asof; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_cj_sector_asof ON public.cj_sector_heat USING btree (as_of);

--
-- Name: ix_market_news_items_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_market_news_items_created_at ON public.market_news_items USING btree (created_at);

--
-- Name: ix_market_signals_news_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_market_signals_news_item_id ON public.market_signals USING btree (news_item_id);

--
-- Name: ix_news_is_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_news_is_processed ON public.market_news_items USING btree (is_processed, published_at);

--
-- Name: ix_news_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_news_published_at ON public.market_news_items USING btree (published_at);

--
-- Name: ix_sector_intel_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sector_intel_date ON public.sector_intelligence USING btree (intel_date);

--
-- Name: ix_signal_processed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_signal_processed_at ON public.market_signals USING btree (processed_at);

--
-- Name: cj_stamp_published_bj; Type: FUNCTION; Schema: public
--

CREATE OR REPLACE FUNCTION public.cj_stamp_published_bj()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at := (now() AT TIME ZONE 'Asia/Shanghai');
    END IF;
    RETURN NEW;
END;
$function$;


--
-- Name: cj_editorial trg_cj_editorial_stamp_published; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cj_editorial_stamp_published BEFORE INSERT OR UPDATE ON public.cj_editorial FOR EACH ROW EXECUTE FUNCTION public.cj_stamp_published_bj();

--
-- Restore a usable search_path for the session that applied this file.
--
-- pg_dump opens with `set_config('search_path', '', false)` so that every
-- object reference in the dump is schema-qualified and cannot be captured
-- by a hostile or stale search_path. That is the right default for the
-- dump, but it leaves the session with an EMPTY search_path: any unqualified
-- query issued afterwards in the same session fails with
-- "relation does not exist". Applying this file with `psql -f` in a session
-- you keep using is a normal thing to do, so the file puts it back.
--
SELECT pg_catalog.set_config('search_path', 'public', false);

--
-- PostgreSQL database dump complete
--

