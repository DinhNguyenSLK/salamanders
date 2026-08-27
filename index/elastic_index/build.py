from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
from pathlib import Path
import argparse
import gzip
import json
from tqdm import tqdm

class ElasticIndex:

    def __init__(self, host, index_name, force=True):
        self.es = Elasticsearch(hosts=[host])
        self.index_name = index_name
        self.force = force

    def create_index(self, mappings):

        if self.es.indices.exists(index=self.index_name):
            if self.force:
                print("Index already exists. Deleting and recreating...")
                self.delete_index()
                self.es.indices.create(index=self.index_name, mappings=mappings)
            else:
                print("Index already exists. Use force=True to delete and recreate.")
                return
        else:
            print("Creating index...")
            self.es.indices.create(index=self.index_name, mappings=mappings)

    def delete_index(self):

        if self.es.indices.exists(index=self.index_name):
            print("Index exists. Deleting...")
            self.es.indices.delete(index=self.index_name)
        else:
            print("Index does not exist. No action taken.")
    
    def add_document(self, document):
        doc_id = document.get("imgID")
        
        if self.es.exists(index=self.index_name, id=doc_id) and not self.force:
            print(f"Doc id {doc_id} already exists, SKIP")
            return
        self.es.index(index=self.index_name, id=doc_id, body=document)

    def add_documents(self, documents):
            
        for document in documents:
            self.add_document(document)

    def update_document(self, document):
        
        



def main_create():

    ES_HOST = "http://localhost:9200"
    INDEX_NAME = "salamanders"
    mappings = {
        
        "properties": {
            "imgID": {"type": "keyword"},
            "videoID": {"type": "keyword"},
            "video_type": {"type": "keyword"},
            "collection": {"type": "keyword", "index": False},
            "title": {"type": "text", "analyzer": "whitespace", "index": False},
            "published_date": {"type": "keyword", "index": False},
            "shot_id": {"type": "keyword", "index": False},
            "startframe": {"type": "integer", "index": False},
            "endframe": {"type": "integer", "index": False},
            "middleframe": {"type": "integer", "index": False},
            "selectedframe": {"type": "integer"},

            "starttime": {"type": "float", "index": False},
            "endtime": {"type": "float", "index": False},
            "middletime": {"type": "float", "index": False},
            "selectedtime": {"type": "float"},

            "asr": {"type": "text", "analyzer": "whitespace"},
            "ocr": {"type": "text", "analyzer": "whitespace"},
            "tags": {"type": "keyword"},

            "object_pos": {"type": "text", "analyzer": "whitespace"},
            "object_count": {"type": "nested", "properties": {
                "label": {"type": "keyword"},
                "count": {"type": "integer"}
                    }}, 
    }}
    

    elastic_index = ElasticIndex(ES_HOST, INDEX_NAME, force=True)
    elastic_index.create_index(mappings=mappings)

    INPUT_DIR = Path("./collection_dir/elastic-documents")

    video_dirs = sorted([d for d in INPUT_DIR.iterdir() if d.is_dir()])

    for video_dir in tqdm(video_dirs, desc="Processing video directories", unit="video"):
        print(f"Processing video directory: {video_dir}")
        video_id = video_dir.stem
        doc_file = video_dir / f'{video_id}-elastic-docs.jsonl.gz'

        if doc_file.exists():
            with gzip.open(doc_file, 'rt', encoding='utf-8') as f:
                documents = [json.loads(line) for line in f]
                elastic_index.add_documents(documents)
                print(f"Added {len(documents)} documents for video {video_id}")
        else:
            print(f"Document file th{doc_file} does not exist. Skipping.")
            return

if __name__ == "__main__":
    main_create()

    # python -m index.elastic_index.build

    
