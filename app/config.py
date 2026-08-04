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

    class Config:
        env_file = ".env"

settings = Settings()
