from base64 import b64encode
from pathlib import Path
import re
from typing import Any

import requests
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel


router = APIRouter()

ALLOWED_SUBMISSION_URL = "http://171.244.37.116:18111/api/v1/submissions"
UPSTREAM_TIMEOUT_SECONDS = 20
KEYFRAME_ROOT = Path(__file__).resolve().parents[2] / "collection_dir" / "selected-frames"
SAFE_MEDIA_ID = re.compile(r"^[A-Za-z0-9_-]+$")
SAFE_FRAME_ID = re.compile(r"^[A-Za-z0-9_-]+(?:\.(?:jpg|jpeg|png|webp))?$", re.IGNORECASE)


class CustomSubmissionProxyRequest(BaseModel):
    target_url: str
    api_key: str
    payload: dict[str, Any]
    video_id: str
    frame_id: str


def load_keyframe_base64(video_id: str, frame_id: str) -> str:
    if not SAFE_MEDIA_ID.fullmatch(video_id) or not SAFE_FRAME_ID.fullmatch(frame_id):
        raise HTTPException(status_code=422, detail="Invalid video or frame ID")

    frame_name = frame_id if Path(frame_id).suffix else f"{frame_id}.jpg"
    image_path = KEYFRAME_ROOT / video_id / frame_name
    if not image_path.is_file():
        raise HTTPException(status_code=422, detail="Keyframe image was not found")

    try:
        return b64encode(image_path.read_bytes()).decode("ascii")
    except OSError as error:
        raise HTTPException(status_code=500, detail="Keyframe image could not be read") from error


@router.post("/custom-submission-proxy")
def proxy_custom_submission(request: CustomSubmissionProxyRequest) -> Response:
    if request.target_url != ALLOWED_SUBMISSION_URL:
        raise HTTPException(status_code=403, detail="Submission endpoint is not allowed")

    payload = dict(request.payload)
    payload["image_base64"] = load_keyframe_base64(request.video_id, request.frame_id)

    try:
        upstream_response = requests.post(
            request.target_url,
            headers={"X-API-Key": request.api_key},
            json=payload,
            timeout=UPSTREAM_TIMEOUT_SECONDS,
        )
    except requests.RequestException as error:
        raise HTTPException(status_code=502, detail="Submission server is unavailable") from error

    headers = {}
    content_type = upstream_response.headers.get("content-type")
    if content_type:
        headers["content-type"] = content_type

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=headers,
    )
