from abc import ABC
import requests
from typing import Any
from schemas import SearchResult
from config import settings
from api.translate import translate

BASEURL = settings.VECTORSEARCH_URL

class APIVectorSearch(ABC):
    def __init__(
            self,
            baseurl: str = BASEURL
    ):
        self.baseurl = baseurl

    def search(
            self,
            query_type: str,
            query: dict[str, Any],
            k: int = 1000,
    ) -> list[SearchResult]:
        
        endpoint = self.baseurl + '/' + query_type
        
        query['k'] = k
        if "textual" in query.keys():
            query['textual'] = translate(query['textual'])

        print(query)
        
        response = requests.post(endpoint, json=query)

        results = [
            SearchResult.model_validate(item)
            for item in response.json()
        ]
        print(f'Vector API results: {results[0].score}')
        return results

        
