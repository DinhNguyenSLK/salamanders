from pydantic import BaseModel, Field, HttpUrl, Base64Bytes, model_validator
from typing import Literal, Self


class ObjectCount(BaseModel):
    label: str
    count: int = Field(ge=0)


class QueryItems(BaseModel):
    textual: str | None = None
    object_pos: str | None = None
    object_count: list[ObjectCount] | None = None
    ocr: str | None = None
    asr: str | None = None
    tags: list[str] | None = None
    qbe: HttpUrl | Base64Bytes | str | None = None
    vf: str | None = None


class ParamItems(BaseModel):
    textual_model: Literal["metaclip", "siglip2", "align"] = "metaclip"
    operator: Literal["or", "and"] = "and"
    range: Literal["lt", "gt", "eq"] = "eq"
    asr_mode: Literal["text", "vector"] = "text"
    ocr_mode: Literal["text", "vector"] = "text"

class SearchParams(BaseModel):
    query: list[QueryItems]
    parameters: list[ParamItems]
    video_type: Literal["all", "cycling", "news", "cooking", "lecture"] = "all"
    k: int = Field(default=1000, ge=100, le=10000, description="Top-k kết quả tốt nhất")
    n_frames_per_round: int = Field(default=10, ge=3, le=30, description="Số frame cho mỗi video id")

    @model_validator(mode="after")
    def query_params_same_length(self) -> Self:
        if len(self.query) != len(self.parameters):
            raise ValueError(
                f"query ({len(self.query)}) và parameters ({len(self.parameters)}) phải cùng độ dài"
            )
        if len(self.query) == 0:
            raise ValueError("query không được rỗng")
        return self


class ImageGeneration(BaseModel):
    text_prompt: str = Field(min_length=1, max_length=100, description="Prompt để tạo ảnh")
    
