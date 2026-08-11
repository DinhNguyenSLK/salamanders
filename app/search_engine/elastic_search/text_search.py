from .base import BaseElasticSearchTemplate
from schemas import SearchParams, SearchResult
from typing import Any
from search_engine.query_parser import QueryObj

class TermQueryTemplate(BaseElasticSearchTemplate):
    def _build_query(
            self,
            term_dict: dict[str, str],
            **kwargs: Any
    ) -> dict[str, Any]:
        
        return {
                "term": {
                    term_dict.get('field'): term_dict.get('value')
                }
            }
        
class MatchQueryTemplate(BaseElasticSearchTemplate):

    def _build_query(
            self,
            match_dict: dict[str, str],

    ) -> dict[str, Any]:
        
        operator = match_dict.get("operator", "or")
        fuzziness = match_dict.get("fuzziness", None)

        match_params = {
            "query": match_dict.get("value"),
            "operator": operator
        }

        if fuzziness:
            match_params['fuzziness'] = fuzziness

        return {
            "match": {
                match_dict.get('field'): match_params
            }
        }
    
class ShouldTermQueryTemplate(BaseElasticSearchTemplate):
    def _build_query(
            self,
            term_list_query: dict[str, Any]
    ) -> dict[str, Any]:
        
        term_list = [{"term" : {term_list_query.get("field"): tag}} for tag in term_list_query.get('value')]

        return {
            "bool": {
                "should": term_list
            }
        }

class FilterQueryTemplate(BaseElasticSearchTemplate):
    def _build_query(self, query_dict, **extra_params):
        
        return {
            "bool": {
                "filter": [
                    query_dict
                ]
            }
        }
    
    def _format_response(self,
                        response: dict[str, Any]
                ) -> list[str]:
        
        hits_section = response.get('hits', {})

        hits = []

        for hit_info in hits_section.get('hits', []):
            imgId = hit_info.get('_id')
            hits.append(imgId)
        return sorted(hits)
    
class TextSearchFactory:

    _registry = {
        "term": TermQueryTemplate,
        "match": MatchQueryTemplate,
        "should_term": ShouldTermQueryTemplate,
        "filter": FilterQueryTemplate,
    }

    @classmethod
    def create(cls,
               query_type,
               es_client,
               index_name
    ):
        template = cls._registry.get(query_type)

        if not template:
            raise ModuleNotFoundError(f"{query_type} chưa hỗ trợ")
        
        return template(
            es_client=es_client,
            index_name = index_name
        )

async def _videotype_filter(es_client, index_name, query):

    if query["value"] == "all":
        return None

    response = await es_client.search(
        index=index_name,
        body={
            "_source": False,
            "stored_fields": [],
            "query": {
                "bool": {
                    "filter": [
                        {
                            "term": {
                                query["field"]: query["value"]
                            }
                        }
                    ]
                }
            },
            "sort": ["_doc"],
        },
        scroll="2m",
        size=5000,
    )

    scroll_id = response["_scroll_id"]
    img_ids = set()

    try:
        while True:
            hits = response["hits"]["hits"]

            if not hits:
                break

            img_ids.update(hit["_id"] for hit in hits)

            response = await es_client.scroll(
                scroll_id=scroll_id,
                scroll="2m",
            )

    finally:
        await es_client.clear_scroll(scroll_id=scroll_id)
    print(f'Video type filter len {len(img_ids)}')

    return img_ids

async def _objectcount_filter(es_client, index_name, query):
    filter_list = []

    print(f'Object count filter with query {query}')

    
    
    for obj in query["value"]:

        if query['range'] == "eq":
            count_filter = {
                    "term" : {
                        f"{query["field"]}.count" : obj.count
                    }
                }
        else:
            count_filter = {
                            "range": {
                                f"{query['field']}.count": {
                                    query["range"] : obj.count
                                                }
                                }
                        }
            
        filter_list.append({
            "nested": {
                "path": query["field"],
                "query": {
                    "bool": {
                        "filter": [
                            {
                                "term": {
                                    f"{query['field']}.label": obj.label
                                }
                            },

                            count_filter
                        ]
                    }
                }
            }
        })

    response = await es_client.search(
        index=index_name,
        body={
            "_source": False,
            "stored_fields": [],
            "query": {
                "bool": {
                    "filter": filter_list
                }
            },
            "sort": ["_doc"],
        },
        scroll="2m",
        size=5000,
    )

    scroll_id = response["_scroll_id"]
    results = set()

    try:
        while True:
            hits = response["hits"]["hits"]

            if not hits:
                break

            results.update(hit["_id"] for hit in hits)

            response = await es_client.scroll(
                scroll_id=scroll_id,
                scroll="2m",
            )

    finally:
        await es_client.clear_scroll(scroll_id=scroll_id)

    print(f"Object count filter len {len(results)}")
    return results
    