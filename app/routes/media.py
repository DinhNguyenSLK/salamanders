from fastapi import APIRouter, Query, Depends
from typing import Annotated
from  search_engine.elastic_search import TextSearchFactory
from config import settings
from search_engine import get_es_client
from elasticsearch import AsyncElasticsearch

router = APIRouter(
    prefix="/getAllVideoKeyframes",
    tags=["get"]
)

index_name = settings.ES_INDEX
@router.get("/")
async def getAllVideoKeyframes(
    videoId: Annotated[str, Query()],
    es_client: Annotated[AsyncElasticsearch, Depends(get_es_client)]
) -> list[str]:
    query_dict = {"term": {"videoID": videoId}}
    template = TextSearchFactory.create('filter', es_client, index_name)
    results = await template.search(query_dict, 3000)
    print(len(results))
    return results
