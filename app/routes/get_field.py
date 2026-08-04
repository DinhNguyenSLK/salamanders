from fastapi import APIRouter, Query, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from typing import Annotated, Any
from pathlib import Path
import json
from elasticsearch import AsyncElasticsearch, NotFoundError

from search_engine import get_es_client
from config import settings

router = APIRouter(
    tags=["get"],
)

ALLOWED_FIELDS = {
    "objectsinfo",
    "objectinfo",
    "ocr",
    "asr",
    "tags",
    "selectedframe",
    "selectedtime",
    "starttime",
    "endtime",
    "middletime",
    "startframe",
    "endframe",
    "middleframe",
}

FIELD_ALIASES = {
    "objectinfo": "objectsinfo",
}

index_name = settings.ES_INDEX


def _format_field_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(str(v) for v in value)
    return str(value)


@router.get("/getField")
async def get_field(
    id: Annotated[str, Query()],
    field: Annotated[str, Query()],
    es_client: Annotated[AsyncElasticsearch, Depends(get_es_client)],
) -> PlainTextResponse:
    field_key = field.strip().lower()
    if field_key not in ALLOWED_FIELDS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Field '{field}' không được hỗ trợ. "
                f"Cho phép: {', '.join(sorted(ALLOWED_FIELDS))}"
            ),
        )

    source_field = FIELD_ALIASES.get(field_key, field_key)

    try:
        doc = await es_client.get(
            index=index_name,
            id=id,
            source_includes=[source_field],
        )
    except NotFoundError:
        return PlainTextResponse("")

    source = doc.get("_source") or {}
    return PlainTextResponse(_format_field_value(source.get(source_field)))


@router.get("/getFps")
async def get_fps(
    videoId: Annotated[str, Query()],
) -> PlainTextResponse:
    """Trả fps từ media-info (cùng nguồn dùng khi encode frame theo ffmpeg)."""
    info_path = Path(settings.MEDIA_INFO_DIR) / f"{videoId}.json"
    if not info_path.is_file():
        raise HTTPException(
            status_code=404,
            detail=f"Không tìm thấy media-info cho videoId={videoId}",
        )
    try:
        with open(info_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi đọc media-info: {e}") from e

    fps = data.get("fps")
    if fps is None:
        raise HTTPException(status_code=404, detail="media-info không có trường fps")
    return PlainTextResponse(str(fps))
