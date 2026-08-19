from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):

    ES_HOST: str = "http://localhost:9200"
    ES_INDEX: str = "salamanders"
    VECTORSEARCH_URL: str
    MEDIA_INFO_DIR: str = str(
        Path(__file__).resolve().parent.parent / "collection_dir" / "media-info"
    )
    OPENROUTER_URL: str
    OPENROUTER_API: str
    SALAMANDERS_KEY: str = ""
    SALAMANDERS_SUBMISSION_URL: str = (
        "http://171.244.37.116:18111/api/v1/submissions"
    )

    class Config:
        # Resolve from this file so the backend always reads app/.env.
        env_file = Path(__file__).resolve().parent / ".env"

settings = Settings()
