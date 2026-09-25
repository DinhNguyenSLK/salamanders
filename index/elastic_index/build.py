from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk, streaming_bulk
from pathlib import Path
import argparse
import gzip
import json
from tqdm import tqdm
from typing import Dict, Any, Iterable

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
        # add single document
        doc_id = document.get("imgID")
        if self.es.exists(index=self.index_name, id=doc_id) and not self.force:
            print(f"Doc id {doc_id} already exists, SKIP")
            return
        self.es.index(index=self.index_name, id=doc_id, body=document)

    def add_documents(self, documents):
        # bulk API, _op_type = index will overwrite if _id existed, = create will no change if _id existed

        op_type = "index" if self.force else "create"

        actions = []

        for document in documents:
            doc_id = document['imgID']

            actions.append(
                {
                    "_op_type": op_type,
                    "_index": self.index_name,
                    "_id": doc_id,
                    "_source": document
                }
            )

        success, failed = bulk(
            self.es,
            actions,
            chunk_size=1000, 
            raise_on_error = False
        )

        print(
                f"Success: {success}, "
                f"Failed: {len(failed)}"
            )

        return success, len(failed)

    def add_new_documents(self, documents: Iterable[Dict[str, Any]], chunk_size=1000):
        """Create documents in bulk without overwriting existing document IDs."""

        def actions():
            for document in documents:
                try:
                    doc_id = document["imgID"]
                except (KeyError, TypeError) as exc:
                    raise ValueError("Each document must contain an 'imgID' field") from exc

                if not doc_id:
                    raise ValueError("Document 'imgID' must not be empty")

                yield {
                    "_op_type": "create",
                    "_index": self.index_name,
                    "_id": doc_id,
                    "_source": document,
                }

        created = 0
        already_exists = 0
        failed = 0

        for ok, item in streaming_bulk(
            self.es,
            actions(),
            chunk_size=chunk_size,
            raise_on_error=False,
            raise_on_exception=False,
            yield_ok=True,
        ):
            result = item.get("create", {})
            status = result.get("status")

            if ok and status == 201:
                created += 1
            elif status == 409:
                # A create conflict means this _id was already in the index (or
                # appeared more than once in the supplied documents).
                already_exists += 1
            else:
                failed += 1
                error = result.get("error", "unknown bulk error")
                print(
                    f"Failed to add document {result.get('_id', '<unknown>')}: "
                    f"status={status}, error={error}"
                )

        print(
            f"New documents added: {created}, "
            f"already existed: {already_exists}, failed: {failed}"
        )
        return created, already_exists, failed
    
    def update_documents(self, documents: Dict[str, Any], updated_fields: list):
        
        actions = []

        

        for document in documents:
            doc_id = document["imgID"]

            actions.append(
                {
                    "_op_type" : "update",
                    "_index" : self.index_name,
                    "_id" : doc_id,
                    "doc" : 
                    {
                        field: document[field] for field in updated_fields
                    }
                }
            )

        success, failed = bulk(
                    self.es,
                    actions,
                    chunk_size=1000, 
                    raise_on_error = False,
                                   )
        
        print(
                f"Success: {success}, "
                f"Failed: {len(failed)}"
            )

        return success, len(failed)
    
def read_gzip(file: Path):

    with gzip.open(file, 'rt', encoding="utf-8") as f:
        data = [json.loads(line) for line in f]

    return data


def iter_gzip(file: Path):
    """Yield JSONL documents one at a time so bulk ingestion stays bounded in memory."""

    with gzip.open(file, 'rt', encoding="utf-8") as f:
        for line_number, line in enumerate(f, start=1):
            if not line.strip():
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON in {file} at line {line_number}") from exc

def create():

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
    
    total_success = 0
    total_failed = 0

    elastic_index = ElasticIndex(ES_HOST, INDEX_NAME, force=True)
    elastic_index.create_index(mappings=mappings)

    INPUT_DIR = Path("./collection_dir/elastic-documents")

    video_dirs = sorted([d for d in INPUT_DIR.iterdir() if d.is_dir()])

    for video_dir in tqdm(video_dirs, desc="Processing video directories", unit="video"):
        print(f"Processing video directory: {video_dir}")
        video_id = video_dir.stem
        doc_file = video_dir / f'{video_id}-elastic-docs.jsonl.gz'

        if doc_file.exists():
            documents = read_gzip(doc_file)
            suc, failed = elastic_index.add_documents(documents)

            total_success += suc
            total_failed += failed

            print(f"Added {len(documents)} documents for video {video_id}")
        else:
            print(f"Document file th{doc_file} does not exist. Skipping.")
            return
    print(f'SUCCESS: {total_success}, FAILED: {total_failed}')


def update():
    # Change in here
    updated_fields = [
        "ocr", "asr", "shot_id"
    ]

    total_success = 0
    total_failed = 0

    ES_HOST = "http://localhost:9200"
    INDEX_NAME = "salamanders"

    elastic_index = ElasticIndex(ES_HOST, INDEX_NAME)

    INPUT_DIR = Path("./collection_dir/elastic-documents")
    
    video_dirs = sorted([d for d in INPUT_DIR.iterdir() if d.is_dir()])

    for video_dir in tqdm(video_dirs, desc="Processing video directories", unit="video"):
        print(f"Processing video directory: {video_dir}")
        video_id = video_dir.stem
        doc_file = video_dir / f'{video_id}-elastic-docs.jsonl.gz'

        if doc_file.exists():
            documents = read_gzip(doc_file)
            suc, failed = elastic_index.update_documents(documents, updated_fields)

            total_success += suc
            total_failed += failed
            
            print(f"Update {len(documents)} documents for video {video_id}")
        else:
            print(f"Document file th{doc_file} does not exist. Skipping.")
            return
        
    print(f'SUCCESS: {total_success}, FAILED: {total_failed}')


def add(
    video_ids: Iterable[str],
    input_dir: Path = Path("./collection_dir/elastic-documents"),
):
    """Add only the requested videos, without rebuilding or overwriting the index."""

    ES_HOST = "http://localhost:9200"
    INDEX_NAME = "salamanders"

    elastic_index = ElasticIndex(ES_HOST, INDEX_NAME, force=False)
    if not elastic_index.es.indices.exists(index=INDEX_NAME):
        raise RuntimeError(
            f"Index '{INDEX_NAME}' does not exist. Run the create command first."
        )

    total_created = 0
    total_existing = 0
    total_failed = 0
    missing_files = 0

    for video_id in video_ids:
        video_dir = input_dir / video_id
        doc_file = video_dir / f"{video_id}-elastic-docs.jsonl.gz"

        if not doc_file.is_file():
            print(f"Document file {doc_file} does not exist. Skipping.")
            missing_files += 1
            continue

        print(f"Adding documents for video {video_id} from {doc_file}")
        created, existing, failed = elastic_index.add_new_documents(
            iter_gzip(doc_file)
        )
        total_created += created
        total_existing += existing
        total_failed += failed

    print(
        f"TOTAL - new documents added: {total_created}, "
        f"already existed: {total_existing}, failed: {total_failed}, "
        f"missing files: {missing_files}"
    )
    return total_created, total_existing, total_failed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build or update the Elasticsearch index")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("create", help="Recreate the index from all document folders")
    subparsers.add_parser("update", help="Update selected fields from all document folders")

    add_parser = subparsers.add_parser(
        "add",
        help="Add documents for specific videos without rebuilding the index",
    )
    add_parser.add_argument(
        "video_ids",
        nargs="*",
        help=(
            "Video folder IDs under collection_dir/elastic-documents. "
            "If omitted, IDs are read from collection_dir/video_ids_add.txt."
        ),
    )

    args = parser.parse_args()
    if args.command is None:
        # Preserve the script's previous behavior.
        update()
    elif args.command == "create":
        create()
    elif args.command == "update":
        update()
    elif args.command == "add":
        if args.video_ids:
            video_ids = args.video_ids
        else:
            root = Path(__file__).resolve().parents[2]
            video_ids_file = root / "collection_dir" / "video_ids_add.txt"

            with video_ids_file.open("r", encoding="utf-8") as file:
                video_ids = list(
                    dict.fromkeys(
                        line.strip()
                        for line in file
                        if line.strip()
                    )
                )

            print(f"Loaded {len(video_ids)} video IDs from {video_ids_file}")

        add(video_ids)

    # python -m index.elastic_index.build add
    # python -m index.elastic_index.build add L21_V001 L21_V002

    
