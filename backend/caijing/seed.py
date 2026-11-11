"""Placeholder market + news seed data.

Two uses:
  1. Market panels (quotes ticker, sector heat, crypto, economic calendar,
     trending keywords, mini charts) are NOT present in the shared news schema
     yet. Until the shared collector is extended to populate them, the /market
     routes serve these constants.
  2. News fallback: when the shared `market_news_items` table is empty (fresh dev
     DB), the /news routes fall back to SAMPLE_HEADLINES / SAMPLE_FLASH so the
     frontend is never blank.

Everything here is bilingual (cn/en) and mirrors the approved design mock. Remove
the market seed once the collector writes real quotes/sectors/crypto/calendar.
"""

from __future__ import annotations

# ── Ticker / global market quotes ──────────────────────────────────────────────
# (name_cn, name_en, value, change, direction)
QUOTES = [
    ("上证指数", "SSE Composite", "3,418.62", "+1.24%", 1),
    ("深证成指", "Shenzhen Component", "10,872.41", "+1.61%", 1),
    ("创业板指", "ChiNext", "2,264.08", "+2.03%", 1),
    ("恒生指数", "Hang Seng", "19,845.30", "-0.42%", -1),
    ("纳斯达克", "Nasdaq", "19,102.77", "+0.88%", 1),
    ("标普500", "S&P 500", "5,982.14", "+0.51%", 1),
    ("美元/人民币", "USD/CNY", "7.0812", "-0.18%", -1),
    ("COMEX黄金", "COMEX Gold", "2,804.30", "+0.74%", 1),
    ("布伦特原油", "Brent Crude", "73.62", "-1.05%", -1),
    ("比特币", "Bitcoin", "96,418", "+3.12%", 1),
    ("10年期国债", "CGB 10Y", "2.094%", "-2.1bp", -1),
    ("CNH/JPY", "CNH/JPY", "21.44", "+0.26%", 1),
]

# Mini charts on the home dashboard.
# (name_cn, name_en, value, change, direction, sparkline points)
CHARTS = [
    ("上证指数", "SSE Composite", "3,418.62", "+1.24%", 1, [22, 20, 24, 19, 23, 14, 17, 11, 9, 6]),
    ("恒生指数", "Hang Seng", "19,845.30", "-0.42%", -1, [9, 11, 8, 13, 12, 16, 15, 19, 18, 21]),
    ("COMEX黄金", "COMEX Gold", "2,804.30", "+0.74%", 1, [24, 22, 23, 18, 16, 17, 12, 10, 8, 5]),
    ("美元/人民币", "USD/CNY", "7.0812", "-0.18%", -1, [12, 13, 11, 14, 16, 15, 18, 17, 20, 19]),
]

# Sector heat map. (name_cn, name_en, change_pct, net_inflow_bn)
SECTORS = [
    ("半导体", "Semis", 3.82, 62.4), ("电力设备", "Power Eq", 2.91, 48.1),
    ("软件服务", "Software", 2.44, 35.7), ("券商", "Brokers", 2.18, 31.2),
    ("消费电子", "Consumer Elec", 1.96, 24.8), ("白酒", "Liquor", 1.74, 19.3),
    ("医药", "Pharma", 1.12, 12.6), ("新能源车", "EV", 0.86, 9.4),
    ("银行", "Banks", 0.41, 4.2), ("保险", "Insurance", 0.18, 1.1),
    ("公用事业", "Utilities", -0.24, -2.6), ("食品饮料", "Food", -0.55, -5.8),
    ("地产", "Property", -0.92, -8.7), ("建材", "Materials", -1.16, -11.4),
    ("钢铁", "Steel", -1.48, -14.9), ("煤炭", "Coal", -1.73, -18.2),
    ("航运", "Shipping", -2.05, -22.6), ("农业", "Agri", -2.61, -27.3),
]

# Crypto majors. (symbol, name_cn, name_en, price, change_pct, color)
COINS = [
    ("BTC", "比特币", "Bitcoin", "96,418.20", 3.12, "#f7931a"),
    ("ETH", "以太坊", "Ethereum", "3,642.85", 2.41, "#627eea"),
    ("SOL", "Solana", "Solana", "214.36", 5.08, "#14f195"),
    ("BNB", "BNB", "BNB", "712.94", 1.16, "#f0b90b"),
    ("XRP", "XRP", "XRP", "2.4180", -1.34, "#23292f"),
    ("TON", "TON", "Toncoin", "5.386", -2.62, "#0098ea"),
]

CRYPTO_STATS = [
    ("总市值", "TOTAL CAP", "3.28万亿美元", "$3.28tn", 1),
    ("恐慌贪婪指数", "FEAR & GREED", "74 贪婪", "74 Greed", 1),
]

# EVM chains. (name_en, name_cn, tvl, gas, change_pct, color)
CHAINS = [
    ("Ethereum", "以太坊主网", "$62.4B", "14", 1.82, "#627eea"),
    ("Base", "Base", "$8.91B", "0.04", 4.26, "#0052ff"),
    ("Arbitrum", "Arbitrum One", "$7.34B", "0.01", 2.05, "#28a0f0"),
    ("BNB Chain", "BNB Chain", "$6.12B", "1.0", -0.74, "#f0b90b"),
    ("Optimism", "OP Mainnet", "$3.28B", "0.02", -1.18, "#ff0420"),
    ("Polygon", "Polygon PoS", "$1.06B", "32", -2.41, "#8247e5"),
]

# New token listings. (symbol, venue_cn, venue_en, date, change_pct)
NEW_TOKENS = [
    ("MOVE", "Binance / 现货", "Binance Spot", "08-11", 46.2),
    ("EIGEN", "OKX / 现货", "OKX Spot", "08-10", 18.7),
    ("ZK", "Coinbase", "Coinbase", "08-09", -6.4),
    ("ENA", "Bybit / 合约", "Bybit Perp", "08-08", 12.3),
    ("SCR", "Upbit", "Upbit", "08-07", -11.8),
    ("BLAST", "Gate / 现货", "Gate Spot", "08-06", 27.5),
]

# Economic calendar. (time, importance 1-3, name_cn, name_en, forecast)
CALENDAR = [
    ("09:30", 3, "中国11月社会消费品零售总额", "China November retail sales", "+4.6%"),
    ("10:00", 2, "中国11月工业增加值", "China November industrial output", "+5.2%"),
    ("15:00", 1, "央行公开市场操作公告", "PBOC open market operations", "—"),
    ("21:30", 3, "美国11月核心PCE物价指数", "US November core PCE", "+2.7%"),
    ("22:00", 2, "美国12月消费者信心指数", "US December consumer confidence", "111.3"),
    ("23:00", 1, "EIA原油库存周报", "EIA crude inventories", "-1.2M"),
]

# Trending keywords. (keyword_cn, keyword_en)
KEYWORDS = [
    ("降准", "RRR cut"), ("核心PCE", "Core PCE"), ("AI算力", "AI compute"),
    ("专项债", "Special bonds"), ("人民币汇率", "Yuan FX"), ("黄金创新高", "Gold record"),
    ("ETF净流入", "ETF inflows"), ("三季报", "Q3 earnings"), ("房地产政策", "Property policy"),
    ("北向资金", "Northbound flows"), ("美联储降息", "Fed cut"), ("储能装机", "Storage capacity"),
]

# Sources catalog. (name_cn, name_en, region)
SOURCES = [
    ("新浪财经", "Sina Finance", "CN"), ("东方财富", "Eastmoney", "CN"),
    ("财新", "Caixin", "CN"), ("第一财经", "Yicai", "CN"),
    ("华尔街见闻", "Wallstreetcn", "CN"), ("雪球", "Xueqiu", "CN"),
    ("Bloomberg", "Bloomberg", "US"), ("Reuters", "Reuters", "UK"),
    ("WSJ", "WSJ", "US"), ("FT", "FT", "UK"),
    ("CNBC", "CNBC", "US"), ("Yahoo Finance", "Yahoo Finance", "US"),
]

# ── News fallback (used only when the shared DB has no rows) ────────────────────
# (title_cn, title_en, category_id)
SAMPLE_HEADLINES = [
    ("央行宣布下调存款准备金率0.25个百分点，释放长期资金约5000亿元", "PBOC cuts reserve requirement ratio by 25bp, releasing about 500bn yuan", "macro"),
    ("沪指收复3400点，两市成交额重回1.2万亿元", "Shanghai Composite reclaims 3,400 as turnover returns above 1.2tn yuan", "equities"),
    ("美联储会议纪要：多数官员支持年内再降息一次", "Fed minutes show most officials back one more cut this year", "us"),
    ("10年期国债收益率跌破2.1%，创阶段新低", "10-year government bond yield falls below 2.1%, a fresh low", "bonds"),
    ("人民币中间价上调至7.08，离岸汇率日内涨逾200点", "Yuan fixing raised to 7.08 as offshore rate gains over 200 pips", "fx"),
    ("国际金价站上每盎司2800美元，年内累计上涨23%", "Gold tops $2,800 an ounce, up 23% year to date", "commodities"),
    ("比特币现货ETF单周净流入18亿美元，创三个月纪录", "Spot bitcoin ETFs draw $1.8bn in a week, a three-month record", "crypto"),
    ("一线城市二手房挂牌量环比下降，成交价格趋稳", "Listings fall in tier-one cities as resale prices steady", "realestate"),
    ("三家头部厂商上调AI服务器订单，产业链排产延至明年一季度", "Top three vendors raise AI server orders into Q1 next year", "tech"),
    ("某消费龙头三季报净利同比增长18%，超市场预期", "Consumer leader posts 18% profit growth, beating expectations", "companies"),
    ("财政部：加快专项债发行，支持重大项目建设", "Finance ministry to speed up special bond issuance for major projects", "policy"),
    ("观点：本轮估值修复能否延续，取决于盈利端的验证", "Opinion: this valuation recovery hinges on earnings confirmation", "opinion"),
    ("统计局：11月CPI同比上涨0.4%，PPI降幅收窄", "Statistics bureau: November CPI up 0.4%, PPI decline narrows", "macro"),
    ("北向资金单日净买入86亿元，加仓电子与电力设备", "Northbound flows buy 8.6bn yuan, adding electronics and power equipment", "equities"),
    ("纳指连续四日创新高，科技七巨头总市值再增1.4万亿美元", "Nasdaq hits fourth straight record as Magnificent Seven add $1.4tn", "us"),
    ("地方债发行进度过半，加权平均期限延长至14.6年", "Local bond issuance passes halfway, average maturity extends to 14.6 years", "bonds"),
    ("美元指数回落至102下方，非美货币普遍反弹", "Dollar index slips below 102 as non-dollar currencies rebound", "fx"),
    ("OPEC+维持减产计划不变，布油短线冲高回落", "OPEC+ keeps output cuts, Brent spikes then retreats", "commodities"),
    ("以太坊质押率升至28%，链上活跃地址创年内新高", "Ethereum staking ratio hits 28% as active addresses peak", "crypto"),
    ("REITs市场扩容，保障性租赁住房项目再获批", "REITs market expands with new affordable rental housing approvals", "realestate"),
    ("国产先进制程设备验证通过，晶圆厂启动小批量导入", "Domestic advanced-node tooling passes validation, fabs begin pilot runs", "tech"),
    ("两家航司披露11月运营数据，客座率回升至85%以上", "Two airlines report November load factors back above 85%", "companies"),
    ("证监会就程序化交易管理规则公开征求意见", "CSRC seeks comment on rules for programmatic trading", "policy"),
    ("观点：从存款搬家看居民资产配置的三个转变", "Opinion: three shifts in household allocation behind deposit migration", "opinion"),
    ("社融数据超预期，企业中长期贷款连续三月改善", "Credit data beats forecasts as corporate medium-term loans improve", "macro"),
]

# Live flash feed. (time, text_cn, text_en)
SAMPLE_FLASH = [
    ("14:58", "央行开展4500亿元7天期逆回购操作，中标利率1.50%", "PBOC conducts 450bn yuan of 7-day reverse repos at 1.50%"),
    ("14:41", "离岸人民币兑美元短线走高，突破7.07关口", "Offshore yuan strengthens past 7.07 against the dollar"),
    ("14:22", "中证白酒指数涨超2%，多只成分股封涨停", "Liquor index up over 2%, several constituents limit up"),
    ("14:05", "欧洲三大股指集体高开，德国DAX涨0.6%", "European indexes open higher, DAX up 0.6%"),
    ("13:47", "某新能源车企宣布下调全系车型指导价", "EV maker cuts guidance prices across its lineup"),
    ("13:30", "现货黄金重回2795美元/盎司，日内转涨", "Spot gold back at $2,795 an ounce, turning positive"),
    ("13:12", "国家发改委：将出台新一批促消费政策措施", "NDRC to roll out a new batch of consumption measures"),
    ("12:55", "港股恒生科技指数半日收涨1.8%", "Hang Seng Tech up 1.8% at the midday break"),
    ("12:31", "两市半日成交额达7200亿元，同比放量14%", "Half-day turnover reaches 720bn yuan, up 14% on the year"),
    ("12:08", "美国十年期国债收益率下行3个基点至4.12%", "US 10-year Treasury yield down 3bp to 4.12%"),
]
