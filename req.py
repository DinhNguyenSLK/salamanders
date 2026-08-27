import requests

import base64



with open("./L21_V010-14936.jpg", "rb") as f:
    encoded = base64.b64encode(f.read()).decode("utf-8")

payload_KIS = {
    "file_name": "query-p1-15-kis",
    "query_content": "Đoạn video về một chương trình từ thiện của một câu lạc bộ tên là FANA. Trong đoạn video có thể thấy câu lạc bộ này đang đi trao quà tại một xã thuộc tỉnh Khánh Hòa.",
    "img_id" : 1234,
    "video_id": "L21_V001",
    "submitter": "dinhnv",
    "image_base64": encoded
}

payload_QA = {
    "file_name": "query-p1-16-qa",
    "query_content": "Đoạn video về một chương trình từ thiện của một câu lạc bộ tên là FANA. Trong đoạn video có thể thấy câu lạc bộ này đang đi trao quà tại một xã thuộc tỉnh Khánh Hòa. Hỏi xã này có tên là gì? (tại thời điểm đó)",
    "img_id" : 1234,
    "video_id": "L21_V001",
    "answer": "xin chào",
    "submitter": "dinhnv"
}
headers = {
    "X-API-Key": "YZQcgu1hEr7ZfbkVF6tKfdkgOTIXUXsOl6BUcAtWHtI_AHtLiIhif5btsuKfPIn_"   # thay bằng API key thật
}

res = requests.post(
"http://171.244.37.116:18111/api/v1/submissions",
headers=headers,
json = payload_KIS
)

print(res.text)

