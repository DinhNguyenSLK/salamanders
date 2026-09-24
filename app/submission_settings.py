from functools import lru_cache
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


APP_DIR = Path(__file__).resolve().parent


class SubmissionSettings(BaseSettings):
    host_submissions_url: str = ""
    host_submissions_api_key: str = ""
    dres_endpoint: str = ""
    dres_session_id: str = ""
    dres_evaluation_id: str = ""
    submissions_allowed_origins: str = (
        "http://127.0.0.1:8000,http://localhost:8000"
    )

    model_config = SettingsConfigDict(
        env_file=(APP_DIR / ".env", APP_DIR / "submission_runtime.env"),
        extra="ignore",
    )


@lru_cache
@lru_cache
def get_submission_settings() -> SubmissionSettings:
    return SubmissionSettings()
