from fastapi import APIRouter
from schemas._request import ImageGeneration
from schemas._response import ImageBase64
from base64 import b64encode

router = APIRouter(
    prefix="/image_generation",
    tags=["Image Generation"],
)

@router.post(
    "/single",
    response_model = ImageBase64
)
async def generate_single_image(
    req: ImageGeneration
):  
    with open("../L21_V010-14936.jpg", "rb") as f:
        return ImageBase64(
            image_base64 = b64encode(f.read()).decode("utf-8")
        )

@router.post(
    "/single",
    response_model = ImageBase64
)
async def generate_single_image(
    req: ImageGeneration
):  
    with open("../L21_V010-14936.jpg", "rb") as f:
        return ImageBase64(
            image_base64 = b64encode(f.read()).decode("utf-8")
        )
