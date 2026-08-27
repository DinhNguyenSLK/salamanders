from pathlib import Path
from typing import Dict, Any
import json
import gzip
from tqdm import tqdm


def process_record_paddle(record: Dict):
    ocr = []

    for item in record['ocr']:
        new_item = item.split()
        for i in new_item:
            word = i.lower().strip(" .,:-!()")
            if word:
                ocr.append(word)

    record['ocr'] = ocr

    return record

def process_record_parseq(record: Dict):

    record['ocr'] = [i.lower().strip(" .,:-!()").replace("'", "") for i in record['ocr']]
    return record


def merged_ocr(record_paddle: Dict, record_parseq: Dict):

    assert record_paddle['_id'] == record_parseq['_id']

    new_record_paddle = process_record_paddle(record_paddle)
    new_record_parseq = process_record_parseq(record_parseq)

    merged_record = {
        "_id": record_parseq["_id"],
        "ocr": list(dict.fromkeys(
                        new_record_parseq['ocr'] + new_record_paddle['ocr']
))
    }

    return merged_record

def read_video_ids():
    with open("./collection_dir/video_ids.txt", "r") as f:
        data = [i.strip("\n") for i in f.readlines() if i]

    return data

def read_gz(file_path: Path):

    with gzip.open(file_path, 'rt') as f:
        data = [json.loads(line) for line in f]

    return data

def main():

    INPUT_PADDLE = Path("./collection_dir/objects-ocr-paddle")
    INPUT_PARSEQ = Path("./collection_dir/objects-ocr-parseq")

    OUTPUT_DIR = Path("./collection_dir/objects-ocr")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    video_ids = read_video_ids()
    

    for video_id in tqdm(video_ids, desc="Merge OCR data...."):
        merged_ocr_list = []
        
        paddle_file = INPUT_PADDLE / video_id / f'{video_id}-objects-ocr.jsonl.gz'
        parseq_file = INPUT_PARSEQ / f'{video_id}-objects-ocr.jsonl.gz'

        paddle_data = read_gz(paddle_file)
        parseq_data = read_gz(parseq_file)

        for paddle_record, parseq_record in zip(paddle_data, parseq_data):
            merged_ocr_list.append(merged_ocr(paddle_record, parseq_record))

        output_file = OUTPUT_DIR / video_id /  f'{video_id}-objects-ocr.jsonl.gz'
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with gzip.open(output_file, 'wt') as f:
            for line in merged_ocr_list:
                f.write(json.dumps(line, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()

    # python -m scripts.merge_ocr