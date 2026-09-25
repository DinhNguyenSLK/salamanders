"""Timed ASR transcript for the video player."""

import csv
import math
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query


router = APIRouter(tags=["get"])
ASR_ROOT = Path(__file__).resolve().parents[2] / "collection_dir" / "asr"
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")


@router.get("/getVideoAsr")
def get_video_asr(videoId: str = Query(...)) -> list[dict]:
    if not VIDEO_ID_PATTERN.fullmatch(videoId):
        raise HTTPException(status_code=422, detail="Invalid videoId")

    path = ASR_ROOT / f"{videoId}-asr.csv"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="ASR unavailable")

    try:
        with path.open("r", encoding="utf-8-sig", newline="") as source:
            rows = csv.DictReader(source)
            if not rows.fieldnames or not {"start_seconds", "end_seconds", "content"}.issubset(rows.fieldnames):
                raise ValueError("Invalid ASR columns")
            transcript = []
            for row in rows:
                start = float(row["start_seconds"])
                end = float(row["end_seconds"])
                if not math.isfinite(start) or not math.isfinite(end) or start < 0 or end < start:
                    raise ValueError("Invalid ASR time range")
                transcript.append({"start_seconds": start, "end_seconds": end, "content": row["content"] or ""})
    except (OSError, UnicodeError, ValueError, TypeError) as error:
        raise HTTPException(status_code=500, detail="Could not read ASR") from error
    return transcript
