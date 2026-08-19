import base64
from typing import Any

import requests
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from config import settings
from schemas import ExternalSubmission


router = APIRouter(
    prefix="/submission",
    tags=["Submission"],
)


def _response_body(response: requests.Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return {"detail": response.text or "Submission service returned an empty response."}


def _image_base64(submission: ExternalSubmission) -> str:
    if submission.image_base64:
        return submission.image_base64
    if not submission.image_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A submitted result must include an image URL or image_base64.",
        )

    try:
        image_response = requests.get(str(submission.image_url), timeout=15)
        image_response.raise_for_status()
    except requests.RequestException as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not retrieve the submitted image: {error}",
        ) from error

    return base64.b64encode(image_response.content).decode("ascii")


@router.post("/external")
def submit_external_result(submission: ExternalSubmission):
    """Forward a KIS result without exposing the external API key to the browser."""
    if not settings.SALAMANDERS_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SALAMANDERS_KEY is not configured on the server.",
        )

    image_base64 = _image_base64(submission)
    payload = submission.model_dump(exclude={"image_url"}, exclude_none=True)
    payload["image_base64"] = image_base64

    try:
        response = requests.post(
            settings.SALAMANDERS_SUBMISSION_URL,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": settings.SALAMANDERS_KEY,
            },
            json=payload,
            timeout=15,
        )
    except requests.RequestException as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach the submission service: {error}",
        ) from error

    return JSONResponse(status_code=response.status_code, content=_response_body(response))
