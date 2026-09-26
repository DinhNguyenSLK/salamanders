from abc import ABC
import requests
from typing import Any
from schemas import SearchResult
from config import settings
from api.translate import Translator
from time import time

BASEURL = settings.VECTORSEARCH_URL

class APIVectorSearch(ABC):
    def __init__(
            self,
            translator = None,
            baseurl: str = BASEURL,
            
    ):
        # English searches do not need a translation client or credentials.
        self.translator = translator
        self.baseurl = baseurl

    def search(
            self,
            query_type: str,
            query: dict[str, Any],
            k: int = 1000,
    ) -> list[SearchResult]:
        
        endpoint = self.baseurl + '/' + query_type
        start = time()

        query = dict(query)
        query['k'] = k
        if query_type == "textual" and "textual" in query:
            language = query.pop("language", "vi")
            if language not in ("vi", "en"):
                raise ValueError(f"Unsupported textual language: {language}")
            if language == "vi":
                if self.translator is None:
                    self.translator = Translator()
                query['textual'] = self.translator.translate(query['textual'])

        print(f'Thời gian translate {-start + time()}')

        print(query)
        

        response = requests.post(endpoint, json=query)
        response.raise_for_status()

        data = response.json()
        if not isinstance(data, list):
            raise RuntimeError(
                f"Vector search backend returned invalid response type: {type(data).__name__}. Response: {data}"
            )

        if len(data) == 0:
            return []

        results = [
            SearchResult.model_validate(item)
            for item in data
        ]
        end = time()
        print(f'KAGLLE OK   Vector API results: {results[0].score} - Thời gian Kaggle phản hồi: {end-start}')

        return results

        
