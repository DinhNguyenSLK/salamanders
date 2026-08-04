import requests
import json

url = "http://localhost:8080/search"

visione_query = {
    "query": [
        {
            "textual": "a man riding a bicycle"
        }
    ]
}

data = {
    "query": json.dumps(visione_query)
}

r = requests.post(url, data=data)

print(r.status_code)
print(r.text[:1000])