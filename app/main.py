from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
import subprocess
import sys
from typing import Annotated

from contextlib import asynccontextmanager
from search_engine import ElasticSearchClientSingleton
from routes import search, media, get_field, rewrite, generate_image, submission

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Chạy khi khởi động app
    ElasticSearchClientSingleton.get_client()

    yield

    # Shutdown: Chạy khi tắt app
    ElasticSearchClientSingleton.close()


app = FastAPI(
    title="Salamanders",
    description= "Composed Retrieval System",
    lifespan = lifespan

)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get("/ping")
def pong():
    return {"message": "pong"}


app.include_router(search.router)
app.include_router(media.router)
app.include_router(get_field.router)
app.include_router(rewrite.router)
app.include_router(generate_image.router)
app.include_router(submission.router)


if __name__ == "__main__":
    subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--port", "8080", "--reload"])
