import requests

from config import settings

OPENROUTER_URL = settings.OPENROUTER_URL
OPENROUTER_API = settings.OPENROUTER_API
LLM_TIMEOUT_SECONDS = 100

HEADER = {
    "Authorization": f"Bearer {OPENROUTER_API}",
    "Content-Type": "application/json",
}

def chat_with_llm(user_content: str, system_content: str) -> str:
    payload = {
        "model": "openai/gpt-oss-20b:free",
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.0,
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=HEADER,
            json=payload,
            timeout=LLM_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        raise RuntimeError(f"OpenRouter request failed: {exc}") from exc

    try:
        obj = response.json()
    except ValueError as exc:
        raise RuntimeError(
            f"OpenRouter returned non-JSON (HTTP {response.status_code})"
        ) from exc

    if response.status_code >= 400:
        detail = obj.get("error", obj)
        raise RuntimeError(f"OpenRouter HTTP {response.status_code}: {detail}")

    if "choices" not in obj or not obj["choices"]:
        raise RuntimeError(f"OpenRouter response missing choices: {obj}")

    content = obj["choices"][0]["message"]["content"]
    if content is None:
        raise RuntimeError("OpenRouter returned empty message content")

    print(f"Rewrite: {content}")
    return str(content).strip()
