from fastapi import APIRouter, HTTPException, Query
from typing import Annotated

from api.llm import chat_with_llm
from prompt.rewrite import EXPLOIT_SYSTEM_PROMPT, EXPLORE_SYSTEM_PROMPT, DECOMPOSE_SYSTEM_PROMPT
from schemas import RewriteResult

router = APIRouter(
    prefix="/rewrite",
    tags=["Rewriting"],
)


@router.get("/exploit", response_model=RewriteResult)
def exploit_query(query: Annotated[str, Query(min_length=1)]):
    # Sync route: chat_with_llm uses blocking requests.post().
    # Do not use async def here without await — that blocks the event loop.
    try:
        rewriting = chat_with_llm(query, EXPLOIT_SYSTEM_PROMPT)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return RewriteResult(rewriting=rewriting)


@router.get("/explore", response_model=RewriteResult)
def explore_query(query: Annotated[str, Query(min_length=1)]):
    try:
        rewriting = chat_with_llm(query, EXPLORE_SYSTEM_PROMPT)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return RewriteResult(rewriting=rewriting)


@router.get("/decompose", response_model=RewriteResult)
def decompose_query(query: Annotated[str, Query(min_length=1)]):
    try:
        rewriting = chat_with_llm(query, DECOMPOSE_SYSTEM_PROMPT)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return RewriteResult(rewriting=rewriting)
