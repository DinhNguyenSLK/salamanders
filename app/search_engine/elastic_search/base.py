from abc import ABC, abstractmethod
from elasticsearch import AsyncElasticsearch, NotFoundError
from schemas import SearchResult, SearchParams
from typing import Any
from search_engine.query_parser import QueryObj

class BaseElasticSearchTemplate(ABC):

    def __init__(
            self,
            es_client: AsyncElasticsearch,
            index_name: str,
    ):
        self.es_client = es_client
        self.index_name = index_name

    async def search(
            self,
            query_dict: dict[str, Any],
            top_k: int = 1000,
            **extra_params: Any
    ) -> list[SearchResult]:

        query_body = self._build_query(query_dict, **extra_params)
        full_body = self._apply_common_options(query_body, top_k)
        response = await self._execute_query(full_body)
        return self._format_response(response)
    
    
    @abstractmethod
    def _build_query(
            self,
            query_dict: dict[str, Any],
            **extra_params: Any          
    ) -> dict[str, Any]:
        """ Trả về query body """
        raise NotImplementedError

    def _apply_common_options(
            self,
            query_body: dict[str, Any],
            top_k: int
    ) -> dict[str, Any]:
        
        return {
            "query": query_body,
            "size": top_k
        }
    
    async def _execute_query(
            self,
            full_body: dict[str, Any]
    ) -> dict[str, Any]:
        
        try:
            response = await self.es_client.search(index=self.index_name, 
                                                   body = full_body
                                        )
            return dict(response)
        except NotFoundError as e:
            raise RuntimeError(f'Index name {self.index_name} không tồn tại') from e
        except Exception as e:
            raise RuntimeError(f'Lỗi khi truy vấn es') from e
    
    def _format_response(self,
                        response: dict[str, Any]
                ) -> list[SearchResult]:
        
        hits_section = response.get('hits', {})

        hits = []

        for hit_info in hits_section.get('hits', []):
            imgId = hit_info.get('_id')
            score = hit_info.get('_score') or 0.0

            _source = hit_info.get('_source') or {}
            video_id = (
                _source.get('videoID')
                or _source.get('videoId')
                or (imgId.split('-')[0] if imgId and '-' in imgId else imgId)
            )
            selected_frame = _source.get('selectedframe')
            if selected_frame is None:
                selected_frame = _source.get('selectedFrame')
            if selected_frame is None and imgId and '-' in imgId:
                try:
                    selected_frame = int(imgId.rsplit('-', 1)[-1])
                except ValueError:
                    selected_frame = 0

            hits.append(
                SearchResult(
                    score=float(score),
                    imgId=str(imgId),
                    videoId=str(video_id),
                    selectedFrame=int(selected_frame),
                )
            )

        return hits

    