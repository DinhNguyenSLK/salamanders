"""Direct DRES submission for TRAKE answers from the video player."""

import json
import re
from typing import Any
from urllib.parse import quote, urlparse

import requests
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from routes.host_submissions import ensure_browser_origin
from submission_settings import SubmissionSettings, get_submission_settings


router = APIRouter(prefix="/trake", tags=["TRAKE"])
SAFE_VIDEO_ID = re.compile(r"[A-Za-z0-9_-]{1,100}\Z")
FRAME_SEQUENCE = re.compile(r"(?:0|[1-9][0-9]*)(?:,(?:0|[1-9][0-9]*))*\Z")


class TrakeSubmission(BaseModel):
    video_id: str
    payload: dict[str, Any]


@router.post("/submit", dependencies=[Depends(ensure_browser_origin)])
def submit_trake(
    submission: TrakeSubmission,
    settings: SubmissionSettings = Depends(get_submission_settings),
) -> JSONResponse:
    video_id = submission.video_id
    payload = submission.payload
    if not SAFE_VIDEO_ID.fullmatch(video_id):
        raise HTTPException(status_code=422, detail="Invalid video ID")
    try:
        answers = payload["answerSets"][0]["answers"]
        answer = answers[0]["text"]
    except (KeyError, IndexError, TypeError):
        raise HTTPException(status_code=422, detail="Expected one TRAKE text answer")
    prefix = f"TR-{video_id}-"
    if (len(payload["answerSets"]) != 1 or len(answers) != 1 or
            not isinstance(answer, str) or not answer.startswith(prefix) or
            not FRAME_SEQUENCE.fullmatch(answer[len(prefix):])):
        raise HTTPException(status_code=422, detail="Invalid TRAKE answer format")
    if len(json.dumps(payload, ensure_ascii=False).encode("utf-8")) > 64 * 1024:
        raise HTTPException(status_code=422, detail="DRES JSON payload exceeds 64 KiB")

    endpoint = settings.dres_endpoint.strip().rstrip("/")
    session_id = settings.dres_session_id.strip()
    evaluation_id = settings.dres_evaluation_id.strip()
    parsed = urlparse(endpoint)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or not session_id or not evaluation_id:
        raise HTTPException(status_code=503, detail="DRES settings are missing or invalid")
    try:
        response = requests.post(
            f"{endpoint}/api/v2/submit/{quote(evaluation_id, safe='')}",
            params={"session": session_id},
            json=payload,
            timeout=35,
            allow_redirects=False,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="DRES connection failed; check DRES before retrying because the answer may have arrived",
        ) from exc
    http_status = 200 if 200 <= response.status_code < 300 else response.status_code
    return JSONResponse(
        status_code=http_status,
        content={"dres_http_status": response.status_code, "dres_response": response.text[:4000]},
    )
