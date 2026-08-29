import base64
import mimetypes
from typing import Any
from urllib.parse import urlsplit

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


SUPPORTED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _normalise_image_mime_type(value: str | None, image_url: str = "") -> str | None:
    """Return a supported MIME type without response-header parameters."""
    mime_type = (value or "").split(";", 1)[0].strip().lower()
    if mime_type in SUPPORTED_IMAGE_MIME_TYPES:
        return mime_type

    image_path = urlsplit(image_url).path.lower()
    extension_mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    for extension, extension_mime_type in extension_mime_types.items():
        if image_path.endswith(extension):
            return extension_mime_type

    guessed_type, _ = mimetypes.guess_type(image_path)
    return guessed_type if guessed_type in SUPPORTED_IMAGE_MIME_TYPES else None


def _image_base64(submission: ExternalSubmission) -> tuple[str, str]:
    if submission.image_base64:
        image_data = submission.image_base64
        if image_data.startswith("data:"):
            mime_type = _normalise_image_mime_type(image_data.split(";", 1)[0][5:])
            if not mime_type:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Submitted image data URL must be JPEG, PNG, or WebP.",
                )
            return image_data, mime_type

        mime_type = _normalise_image_mime_type(submission.image_mime_type)
        if not mime_type:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="image_mime_type is required for a raw image_base64 value.",
            )
        return image_data, mime_type

    if not submission.image_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A submitted result must include a JPEG, PNG, or WebP image.",
        )

    url_str = str(submission.image_url)
    image_urls = [url_str]
    # Keyframes are JPEG, while the locally indexed fallback is WebP.
    if "/keyframes/" in url_str:
        image_urls.append(
            url_str.replace("/keyframes/", "/thumbnails/").rsplit(".", 1)[0] + ".webp"
        )

    for image_url in image_urls:
        try:
            image_response = requests.get(image_url, timeout=15)
        except requests.RequestException:
            continue

        mime_type = _normalise_image_mime_type(
            image_response.headers.get("Content-Type"), image_url
        )
        if image_response.ok and image_response.content and mime_type:
            return base64.b64encode(image_response.content).decode("ascii"), mime_type

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Could not retrieve a valid JPEG, PNG, or WebP image for this submission.",
    )


@router.post("/external")
def submit_external_result(submission: ExternalSubmission):
    """Forward a KIS result without exposing the external API key to the browser."""
    if not settings.SALAMANDERS_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SALAMANDERS_KEY is not configured on the server.",
        )

    image_base64, image_mime_type = _image_base64(submission)
    payload = submission.model_dump(exclude={"image_url"}, exclude_none=True)
    payload["image_base64"] = image_base64
    payload["image_mime_type"] = image_mime_type

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
