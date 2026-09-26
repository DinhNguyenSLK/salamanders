from pydantic import BaseModel
from typing import List, Any


# Input là dict sau đó validation, nếu ko thỏa ném lỗi
class CacheResult(BaseModel):
    content: str
    results: List[Any]
    mode: str = "no"
    top_k: int = 1000
    fuzziness: str | int = "no"
    operator: str = "no"
    language: str = "vi"


class MemoryCache:
    """
    Memory cache of textual, ocr and asr results
    cache = {
                "textual": [{"content": "", "results": [...], "mode": "", "top_k": ""}],
                "ocr": [],
                "asr": []
    }

    Support get and set
    """
    def __init__(self, maximum_size: int = 20):
        self._cache = {}
        self.maximum_size = maximum_size

    def get(self, field: str, content: str, mode: str = "no", top_k: int = 1000, fuzziness: str |int = "no", operator: str = "no", language: str = "vi"):

        if field in self._cache:
            for cache_result in reversed(self._cache[field]):
                if (cache_result.content.strip().lower() == content.strip().lower()
                        and cache_result.mode == mode
                        and cache_result.top_k == top_k
                        and cache_result.fuzziness == fuzziness
                        and cache_result.operator == operator
                        and cache_result.language == language
                        ):
                    return cache_result.results
            return None
        
        self._cache[field] = []
        return None 

    def set(self, field: str, record: dict):

        self._cache[field].append(CacheResult(**record))

        diff = len(self._cache[field]) - self.maximum_size
        if  diff > 0:
            self._cache[field] = self._cache[field][diff:]
