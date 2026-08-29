from pydantic import AnyHttpUrl, Base64Bytes, BaseModel, Field, HttpUrl, model_validator
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
    textual_model: Literal["metaclip2", "siglip2", "align"] = "metaclip2"
    operator: Literal["or", "and"] = "and"
    range: Literal["lt", "gt", "eq"] = "eq"
    asr_mode: Literal["text", "vector"] = "text"
    ocr_mode: Literal["text", "vector"] = "text"

class SearchParams(BaseModel):
    query: list[QueryItems]
    parameters: list[ParamItems]
    video_type: Literal["all", "cycling", "news", "cooking", "lecture"] = "all"
    video_id: str | None = Field(default=None, min_length=1, max_length=255)
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


class ExternalSubmission(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    video_id: str = Field(min_length=1, max_length=255)
    img_id: int = Field(ge=0)
    submitter: Literal["external"] = "external"
    image_url: AnyHttpUrl | None = None
    image_base64: str | None = None
    image_mime_type: str | None = None


class ImageGeneration(BaseModel):
    text_prompt: str = Field(min_length=1, max_length=100, description="Prompt để tạo ảnh")
    
