from pathlib import Path
import re

from fastapi import APIRouter, Query, Depends, HTTPException
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
KEYFRAME_ROOT = Path(__file__).resolve().parents[2] / "collection_dir" / "selected-frames"
SAFE_VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]+$")
KEYFRAME_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def list_local_keyframes(video_id: str) -> list[str] | None:
    video_dir = KEYFRAME_ROOT / video_id
    if not video_dir.is_dir():
        return None

    return sorted(
        path.stem
        for path in video_dir.iterdir()
        if path.is_file() and path.suffix.lower() in KEYFRAME_EXTENSIONS
    )


@router.get("/")
async def getAllVideoKeyframes(
    videoId: Annotated[str, Query()],
    es_client: Annotated[AsyncElasticsearch, Depends(get_es_client)]
) -> list[str]:
    if not SAFE_VIDEO_ID.fullmatch(videoId):
        raise HTTPException(status_code=422, detail="Invalid video ID")

    local_results = list_local_keyframes(videoId)
    if local_results is not None:
        return local_results

    query_dict = {"term": {"videoID": videoId}}
    template = TextSearchFactory.create('filter', es_client, index_name)
    results = await template.search(query_dict, 3000)
    print(len(results))
    return results
