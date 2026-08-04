from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    score: float = Field(0, ge=0, description="Score trả về cho một ảnh")
    imgId: str = Field(description="Ví dụ: L21_V001-00365")
    videoId: str = Field(description="Ví dụ: L21_V001")
    selectedFrame: int = Field(ge=0, le=100000)

class RewriteResult(BaseModel):
    rewriting: str = Field(description="Query được viết lại bởi LLM")

class ImageBase64(BaseModel):
    image_base64: str = Field(min_length=1, description="Ảnh được mã hóa base64")
    