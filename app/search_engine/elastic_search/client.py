from elasticsearch import AsyncElasticsearch
from config import settings

ES_HOST = settings.ES_HOST
ES_INDEX = settings.ES_INDEX

class ElasticSearchClientSingleton:
    """ Đảm bảo chỉ có 1 client trong suốt vòng đời của APP """

    _client: AsyncElasticsearch | None = None

    @classmethod
    def get_client(cls) -> AsyncElasticsearch:
        if cls._client is None:
            cls._client = AsyncElasticsearch(hosts = [ES_HOST])
        
        return cls._client
    
    @classmethod
    async def close(cls):
        if cls._client is not None:
            await cls._instance.close
            cls._client = None

def get_es_client() -> AsyncElasticsearch:
    """ Dependency injection """
    return ElasticSearchClientSingleton().get_client()