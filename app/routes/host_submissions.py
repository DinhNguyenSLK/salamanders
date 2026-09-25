"""Salamanders' server-side bridge to the shared submit_all host and DRES."""

from base64 import b64encode
from copy import deepcopy
import json
from pathlib import Path
import re
from typing import Any
from urllib.parse import urljoin, urlparse, urlunparse
from uuid import UUID

import requests
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from pydantic import BaseModel, Field

from submission_settings import SubmissionSettings, get_submission_settings


router = APIRouter(prefix="/host-submissions", tags=["host submissions"])
KEYFRAME_ROOT = Path(__file__).resolve().parents[2] / "collection_dir" / "selected-frames"
SAFE_MEDIA_ID = re.compile(r"^[A-Za-z0-9_-]{1,100}$")
SAFE_FRAME_ID = re.compile(r"^[A-Za-z0-9_-]{1,200}(?:\.(?:jpg|jpeg|png|webp))?$", re.I)
MAX_IMAGE_BYTES = 5 * 1024 * 1024
HOST_TIMEOUT = 20
DRES_TIMEOUT = 35


class CreateSubmission(BaseModel):
    file_name: str = Field(min_length=1, max_length=259)
    query_content: str = Field(default="", max_length=256 * 1024)
    img_id: int = Field(ge=0)
    video_id: str
    frame_id: str
    start_ms: int | None = Field(default=None, ge=0)
    end_ms: int | None = Field(default=None, ge=0)
    timestamp_ms: int | None = Field(default=None, ge=0)
    answer: str | None = Field(default=None, max_length=2048)


class SubmitDresRequest(BaseModel):
    dres_payload: dict[str, Any] | None = None


def ensure_browser_origin(
    request: Request,
    settings: SubmissionSettings = Depends(get_submission_settings),
) -> None:
    origin = request.headers.get("origin")
    if origin and origin not in {
        item.strip() for item in settings.submissions_allowed_origins.split(",") if item.strip()
    }:
        raise HTTPException(status_code=403, detail="Origin is not allowed")


def host_config(settings: SubmissionSettings) -> tuple[str, dict[str, str]]:
    base = settings.host_submissions_url.strip().rstrip("/")
    key = settings.host_submissions_api_key.strip()
    parsed = urlparse(base)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or not key:
        raise HTTPException(
            status_code=503,
            detail="Set HOST_SUBMISSIONS_URL and HOST_SUBMISSIONS_API_KEY on this Salamanders backend",
        )
    return base, {"X-API-Key": key}


def host_request(
    method: str,
    path: str,
    settings: SubmissionSettings,
    **kwargs: Any,
) -> requests.Response:
    base, headers = host_config(settings)
    headers.update(kwargs.pop("headers", {}))
    try:
        return requests.request(
            method,
            f"{base}/api/v1/{path.lstrip('/')}",
            headers=headers,
            timeout=HOST_TIMEOUT,
            allow_redirects=False,
            **kwargs,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Submission host is unavailable") from exc


def upstream_json(response: requests.Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return {"detail": response.text[:1000] or "Submission host returned an invalid response"}


def checked_host_response(response: requests.Response) -> Any:
    body = upstream_json(response)
    if not 200 <= response.status_code < 300:
        raise HTTPException(status_code=response.status_code, detail=body)
    return body


def default_dres_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Keep the local QA format when the shared host returns an older payload.

    Explicitly edited JSON bypasses this conversion. KIS answers have no text.
    """
    result = deepcopy(payload)
    for answer_set in result.get("answerSets", []):
        for answer in answer_set.get("answers", []):
            value = answer.get("text")
            if isinstance(value, str) and not value.startswith("QA-"):
                answer["text"] = "QA-" + value
    return result


def load_keyframe(video_id: str, frame_id: str) -> str | None:
    if not SAFE_MEDIA_ID.fullmatch(video_id) or not SAFE_FRAME_ID.fullmatch(frame_id):
        raise HTTPException(status_code=422, detail="Invalid video or frame ID")
    frame_name = frame_id if Path(frame_id).suffix else f"{frame_id}.jpg"
    image_path = KEYFRAME_ROOT / video_id / frame_name
    if not image_path.is_file():
        # A user can submit a frame selected in the video player even when it
        # has not been exported as a keyframe. The host can store it without an image.
        return None
    try:
        if image_path.stat().st_size > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=422, detail="Keyframe exceeds 5 MiB")
        return b64encode(image_path.read_bytes()).decode("ascii")
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Keyframe could not be read") from exc


@router.get("/me", dependencies=[Depends(ensure_browser_origin)])
def member_info(settings: SubmissionSettings = Depends(get_submission_settings)) -> Any:
    return checked_host_response(host_request("GET", "auth/me", settings))


@router.post("", dependencies=[Depends(ensure_browser_origin)])
def create_submission(
    payload: CreateSubmission,
    idempotency_key: str | None = Header(default=None),
    settings: SubmissionSettings = Depends(get_submission_settings),
) -> Any:
    if not SAFE_MEDIA_ID.fullmatch(payload.video_id):
        raise HTTPException(status_code=422, detail="Invalid video ID")
    image = load_keyframe(payload.video_id, payload.frame_id)
    body = payload.model_dump(exclude_none=True)
    if image is not None:
        body["image_base64"] = image
    headers = {"Idempotency-Key": idempotency_key} if idempotency_key else {}
    response = host_request("POST", "submissions", settings, json=body, headers=headers)
    return checked_host_response(response)


@router.get("", dependencies=[Depends(ensure_browser_origin)])
def list_submissions(settings: SubmissionSettings = Depends(get_submission_settings)) -> Any:
    return checked_host_response(
        host_request("GET", "submissions", settings, params={"limit": 500})
    )


@router.delete("", dependencies=[Depends(ensure_browser_origin)])
def clear_submissions(settings: SubmissionSettings = Depends(get_submission_settings)) -> Any:
    return checked_host_response(host_request("DELETE", "submissions", settings))


@router.get("/realtime-ticket", dependencies=[Depends(ensure_browser_origin)])
def realtime_ticket(settings: SubmissionSettings = Depends(get_submission_settings)) -> Any:
    result = checked_host_response(host_request("POST", "realtime-token", settings))
    base, _ = host_config(settings)
    hub_url = urljoin(base + "/", str(result.get("hubUrl", "" )).lstrip("/"))
    parsed = urlparse(hub_url)
    if parsed.scheme not in {"http", "https"} or parsed.netloc != urlparse(base).netloc:
        raise HTTPException(status_code=502, detail="Invalid realtime URL from host")
    result["hubUrl"] = urlunparse(parsed._replace(scheme="wss" if parsed.scheme == "https" else "ws"))
    return result


@router.get("/{submission_id}/image", dependencies=[Depends(ensure_browser_origin)])
def submission_image(
    submission_id: UUID,
    settings: SubmissionSettings = Depends(get_submission_settings),
) -> Response:
    response = host_request("GET", f"submissions/{submission_id}/image", settings)
    if not 200 <= response.status_code < 300:
        raise HTTPException(status_code=response.status_code, detail="Image unavailable")
    return Response(
        content=response.content,
        media_type=response.headers.get("content-type", "application/octet-stream"),
    )


@router.post("/{submission_id}/submit-dres", dependencies=[Depends(ensure_browser_origin)])
def submit_to_dres(
    submission_id: UUID,
    payload: SubmitDresRequest | None = None,
    settings: SubmissionSettings = Depends(get_submission_settings),
) -> Any:
    endpoint = settings.dres_endpoint.strip().rstrip("/")
    session_id = settings.dres_session_id.strip()
    evaluation_id = settings.dres_evaluation_id.strip()
    if not endpoint or not session_id or not evaluation_id:
        raise HTTPException(status_code=503, detail="DRES settings are missing on this Salamanders backend")
    if urlparse(endpoint).scheme not in {"http", "https"}:
        raise HTTPException(status_code=503, detail="DRES endpoint is invalid")

    edited_payload = payload.dres_payload if payload and payload.dres_payload is not None else None
    if edited_payload is not None and len(
        json.dumps(edited_payload, ensure_ascii=False).encode("utf-8")
    ) > 64 * 1024:
        raise HTTPException(status_code=422, detail="DRES JSON payload exceeds 64 KiB")

    claim = checked_host_response(host_request(
        "POST", f"submissions/{submission_id}/claim", settings,
    ))
    token = claim["claimToken"]
    dres_payload = edited_payload if edited_payload is not None else default_dres_payload(claim["dresPayload"])
    dres_url = f"{endpoint}/api/v2/submit/{evaluation_id}"
    outcome_certain = True
    accepted = False
    dres_status = None
    dres_text = ""
    try:
        dres_response = requests.post(
            dres_url,
            params={"session": session_id},
            json=dres_payload,
            timeout=DRES_TIMEOUT,
            allow_redirects=False,
        )
        dres_status = dres_response.status_code
        dres_text = dres_response.text[:4000]
        accepted = 200 <= dres_response.status_code < 300
    except requests.RequestException:
        # A timeout after sending may have reached DRES. Never allow an automatic retry.
        outcome_certain = False
        dres_text = "DRES transport failed; inspect DRES before retrying"

    try:
        completion = host_request(
            "POST", f"submissions/{submission_id}/complete", settings,
            json={
                "claimToken": token,
                "accepted": accepted,
                "dresHttpStatus": dres_status,
                "dresResponse": dres_text,
                "outcomeCertain": outcome_certain,
            },
        )
    except HTTPException as exc:
        raise HTTPException(
            status_code=502,
            detail="DRES may have been contacted, but host status could not be updated. Check both systems before retrying.",
        ) from exc
    if not 200 <= completion.status_code < 300:
        raise HTTPException(
            status_code=502,
            detail="DRES was contacted, but the host status could not be updated. Check both systems before retrying.",
        )
    return {"submission": upstream_json(completion), "dres_http_status": dres_status,
            "dres_response": dres_text, "outcome_certain": outcome_certain}
