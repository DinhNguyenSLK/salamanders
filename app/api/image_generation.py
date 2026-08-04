from google import genai
from google.genai import types
import base64

client = genai.Client(
    api_key="YOUR_API_KEY"
)

def generate_image(prompt: str, model: str = )
response = client.models.generate_content(
    model="gemini-2.5-flash-image-preview",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE"]
    )
)

image_bytes = response.candidates[0].content.parts[0].inline_data.data

image_base64 = base64.b64encode(image_bytes).decode("utf-8")

print(image_base64)