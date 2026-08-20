import requests
import json

url = "http://192.168.28.151:5000/api/v2/collection/1716c107-11e0-431c-8ed2-86306834a0bd"

cookies = {
    "SESSIONID": "Q2Vw6I7IPQaYdJkDpMiMjM62NwhOA8IN"
}

response = requests.get(url, cookies=cookies)

print("Status:", response.status_code)
print("Body:", response.text)

if response.status_code == 200:
    data = response.json()

    data = data.get("items")
    new_data = {}

    for i in data:
        new_data[i.get('name')] = i.get("mediaItemId")

    with open("./video_clb.json", "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=4, ensure_ascii=False)