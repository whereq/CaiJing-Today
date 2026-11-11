"""Schema round-trip tests.

The frontend's TypeScript types mirror these Pydantic models field-for-field;
a change here must be mirrored in `frontend/src/api/client.ts`.
"""

from api.schemas.market import HotStock, Quote
from api.schemas.news import Article, NewsCard, SearchResponse


def test_news_card_round_trip():
    card = NewsCard(
        id=1,
        title="标题",
        source="gdelt",
        category="macro",
        published_at="2026-08-12T12:00:00+00:00",
        heat=80.0,
    )
    assert NewsCard.model_validate(card.model_dump()).id == 1
    assert card.heat == 80.0


def test_search_response_carries_the_true_total():
    resp = SearchResponse(results=[], total=1284)
    assert resp.total == 1284
    assert resp.results == []
    assert SearchResponse.model_validate(resp.model_dump()).total == 1284


def test_article_round_trip():
    article = Article(
        id=-1,
        ref="CJ--1",
        category="policy",
        title="标题",
        source="财经今日",
        author_cn="编辑部",
        author_en="Editorial",
        published_at="2026-08-12T12:00:00+00:00",
        lede_cn="导语",
        lede_en="Lede",
        body_cn=["正文"],
        body_en=["Body"],
        stats=[],
        tags_cn=["政策"],
        tags_en=["Policy"],
        related=[],
        flash=[],
    )
    assert Article.model_validate(article.model_dump()).body_cn == ["正文"]


def test_market_models_round_trip():
    quote = Quote(name_cn="上证", name_en="SSE", value="3,418.62", change="+1.24%", direction=1)
    assert Quote.model_validate(quote.model_dump()).direction == 1

    stock = HotStock(
        rank=1, symbol="600519", name_cn="贵州茅台", name_en="Kweichow Moutai",
        market="cn", heat=100.0, change_pct=10.04, trend=0,
    )
    assert HotStock.model_validate(stock.model_dump()).rank == 1
