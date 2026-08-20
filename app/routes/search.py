from fastapi import APIRouter, Depends, HTTPException
from schemas import SearchResult, SearchParams
from search_engine import get_es_client, QueryParser
from elasticsearch import AsyncElasticsearch
from typing import Annotated
from config import settings
from search_engine import TextSearchFactory, APIVectorSearch, _videotype_filter, _objectcount_filter
from search_engine._utils import _filter, _temporal, _slice, _merge
import time

router = APIRouter(
    prefix="/search",
    tags=["ElasticSearch", "FaissSearch"],
)

_video_type_cache: dict[str, set[str]] = {}

async def get_video_type_filter(es_client, index_name, video_type):
    if video_type == "all":
        return None

    if video_type not in _video_type_cache:
        _video_type_cache[video_type] = await _videotype_filter(
            es_client,
            index_name,
            {
                "field": "video_type",
                "value": video_type,
            },
        )

    return _video_type_cache[video_type]


# def load_video_filter(
#         index_name,
#         es_client = get_es_client(),
        
# ):
#     video_types = ["news", "cycling", "dance", "cooking", "lecture", "lifelog"]
#     for video_type in video_types:
#         get_video_type_filter(
#             es_client, 
#             index_name, video_type
#         )

index_name = settings.ES_INDEX

vector_search = APIVectorSearch()
# e = time.time()
# load_video_filter(index_name)
# print(f'Thời gian load xong filter {time.time()- e}')

@router.post("/", response_model=list[SearchResult])
async def search(
    params: SearchParams,
    es_client: Annotated[AsyncElasticsearch, Depends(get_es_client)],
):  
    print(100*"=")
    # Tính thời gian phản hồi
    start_time = time.time()

    queries = QueryParser(params)
    k = queries.params.k
    n_frames_per_round = queries.params.n_frames_per_round
    video_type_filter = await get_video_type_filter(
        es_client,
        index_name,
        queries.params.video_type,
    )

    e1 = time.time()
    print(f'thời gian từ đầu đến filter {e1-start_time}')

    if video_type_filter is not None:
        print(f"Len {queries.params.video_type} = {len(video_type_filter)}")

    all_results = []
    

    for tab in range(queries.num_tab):
        queryObj = queries.get(tab)

        # FILTER PART
        filter_results = [video_type_filter] if video_type_filter else []
        
        if queryObj.get("object_count"):
            objcount_query = queryObj.parseObjCount()
            objcount_results = await _objectcount_filter(es_client, index_name, objcount_query)
            filter_results.append(objcount_results)

        if len(filter_results) > 0:
            pre_filter_results = set.intersection(*filter_results)
        else:
            pre_filter_results = None

        e1 =  time.time()
        print(f'Thời gian từ đầu đến lấy kết quả filter {e1 - start_time}')

        # Visual Similarity Part
        if queryObj.get("vf"):
            vf_query = queryObj.parseVf()
            results = vector_search.search("vf", vf_query, k)
            filtered_results = _filter(results, pre_filter_results)
            sliced_results = _slice(filtered_results, n_frames_per_round)
            return sliced_results

        if queryObj.get("qbe"):
            qbe_query = queryObj.parseQbe()
            results = vector_search.search("qbe", qbe_query, k)
            filtered_results = _filter(results, pre_filter_results)
            sliced_results = _slice(filtered_results, n_frames_per_round)
            return sliced_results

        # Composed Part
        tab_results = dict()

        e1 = time.time()
        print(f'Thời gian từ đầu đến trước khi textual search {e1-start_time}')
        
        if queryObj.get("textual"):
            textual_query = queryObj.parseTextual()
            results = vector_search.search("textual", textual_query, k)
            tab_results["textual"] = results

        e1 = time.time()
        print(f'Thời gian từ đầu đến xong textual search {e1-start_time}')
        
        if queryObj.get("object_pos"):
            pos_query = queryObj.parsePos()
            template = TextSearchFactory.create("match", es_client, index_name)
            results = await template.search(pos_query, k)
            tab_results["object_pos"] = results
        
        # OCR PART
        if queryObj.get("ocr"):

            if queryObj.get_mode('ocr_mode') == "text":

                print("OCR MODE: TEXT")
                ocr_query = queryObj.parseOcr()
                template = TextSearchFactory.create("match", es_client, index_name)
                results = await template.search(ocr_query, k)
                tab_results["ocr"] = results

            else:
                print('No implement')
                pass

        # ASR PART
        if queryObj.get("asr"):

            if queryObj.get_mode('asr_mode') == "text":
                print("ASR MODE: TEXT")
                asr_query = queryObj.parseAsr()
                template = TextSearchFactory.create("match", es_client, index_name)
                results = await template.search(asr_query, k)
                tab_results["asr"] = results
            else:
                print('No implement')
                pass

        # TAGS PART
        if queryObj.get("tags"):
            tags_query = queryObj.parseTags()
            template = TextSearchFactory.create("should_term", es_client, index_name)
            results = await template.search(tags_query, k)
            tab_results["tags"] = results

        e2 = time.time()
        print(f'Thời gian trước khi merge và filter {e2-start_time}')
        # FINAL LOGIC
        merged_results = _merge(tab_results)
       
        filtered_results = _filter(merged_results, pre_filter_results)
        
        all_results.append(filtered_results)

        
    e1 = time.time()
    print(f'Thời gian trước khi slice và temporal {e1 - start_time}')

    temporal_results = _temporal(all_results)
    
    sliced_results = _slice(temporal_results, n_frames_per_round)
    
    end_time = time.time()

    print(f'Thời gian backend phản hồi {end_time-start_time}')

    return sliced_results
