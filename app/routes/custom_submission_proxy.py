from typing import Any

import requests
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel


router = APIRouter()

ALLOWED_SUBMISSION_URL = "http://171.244.37.116:18111/api/v1/submissions"
UPSTREAM_TIMEOUT_SECONDS = 20


class CustomSubmissionProxyRequest(BaseModel):
    target_url: str
    api_key: str
    payload: dict[str, Any]


@router.post("/custom-submission-proxy")
def proxy_custom_submission(request: CustomSubmissionProxyRequest) -> Response:
    if request.target_url != ALLOWED_SUBMISSION_URL:
        raise HTTPException(status_code=403, detail="Submission endpoint is not allowed")

    try:
        upstream_response = requests.post(
            request.target_url,
            headers={"X-API-Key": request.api_key},
            json=request.payload,
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
