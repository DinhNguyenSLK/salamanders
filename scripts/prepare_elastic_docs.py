from pathlib import Path
import argparse
import gzip
import json
import csv
from tqdm import tqdm
from unidecode import unidecode

import pandas as pd

class PrepareElasticDocs:
    """
    Tiền xử lý và Merge các thông tin về scene và object của mỗi frames
    
    """
    def __init__(self, video_ids, output_template, collection_dir, force):

        self.video_ids = self.read_video_ids(video_ids)
        self.output_template = output_template
        self.collection_dir = collection_dir
        self.force = force

        
    def read_video_ids(self, video_ids):
        with open(video_ids, 'r') as f:
            data = sorted([i.strip() for i in f.readlines() if i])
        return data
    
    def read_csv(self, csv_path):
        asr_data = pd.read_csv(csv_path)
        asr_list = []
        for row in asr_data.itertuples():
            start_seconds = row.start_seconds
            end_seconds = row.end_seconds
            content = row.content
            asr_list.append({
                "start_seconds": start_seconds,
                "end_seconds": end_seconds,
                "content": unidecode(content.lower().strip())
            })
        return asr_list
    
    def find_asr_content(self, asr_data, selected_time):
        """
        Tìm kiếm nội dung ASR dựa trên thời gian được chọn
        """
        low =0
        high = len(asr_data) - 1
        while low <= high:
            mid = (low + high) // 2

            if asr_data[mid]['start_seconds'] <= selected_time <= asr_data[mid]['end_seconds']:
                return asr_data[mid]['content']

            elif selected_time < asr_data[mid]['start_seconds']:
                high = mid - 1
            else:
                low = mid + 1

        return ""

    def load_json(self, json_path):
        """
        Đọc file media-info của BTC cung cấp
        """
        for encoding in ["utf-8", "cp1252", "latin1"]:
            try:
                with open(json_path, "r", encoding=encoding) as f:
                    return json.load(f)
            except UnicodeDecodeError:   
                continue
        raise ValueError(f"Khong doc duoc file {json_path}")
    
    def find_image_info(self, scene_data, media_info_data, asr_data, frame_id):

        fps = media_info_data['fps']
        video_type = media_info_data['video_type']
        desc = media_info_data['description']
        title = unidecode(media_info_data['title'].lower().strip())
        published_date = media_info_data['publish_date']

        low = 0
        high = len(scene_data) - 1

        while low <= high:
            mid = (low + high) // 2

            row = scene_data[mid]    
            start_fr = int(row['start_frame'])
            end_fr = int(row['end_frame'])

            if start_fr <= frame_id <= end_fr:
                
                start_seconds = float(row['start_seconds'])
                end_seconds = float(row['end_seconds'])

                selected_time = round(float(frame_id)/fps, 3)

                middle_fr = int(start_fr + end_fr) // 2
                middle_time = round(float(start_seconds + end_seconds) / 2, 3)

                return {
                    "video_type": video_type,
                    
                    "title": title,
                    "published_date": published_date,

                    "startframe": start_fr,
                    "endframe": end_fr,
                    "middleframe": middle_fr,
                    "selectedframe":frame_id,
                    "starttime": start_seconds,
                    "endtime": end_seconds,
                    "middletime": middle_time,
                    "selectedtime": selected_time,

                    "asr": self.find_asr_content(asr_data, selected_time)
                }
            
            elif frame_id < start_fr:
                high = mid - 1

            else:
                low = mid + 1

        raise ValueError(f"Khong tim thay thong tin cho frame_id {frame_id} trong scene_data")
    
    def process_ocr_data(self, record):
        """
        Xử lý dữ liệu OCR để chuẩn bị cho Elasticsearch.
        """
        ocr_data = record.get("ocr") or []

        record["ocr"] = (
            " ".join(ocr_data)
            .lower()
            .replace(".", " ")
            .replace(",", " ")
        )

        return record
    
    def process_tag_data(self, record):
        """
        Xử lý dữ liệu tag để chuẩn bị cho elastic 
        replace space with underscore and convert to lower case
        """
        tag_data = record.get('tags', [])
        tag_data = [tag.replace(' ', '_').strip() for tag in tag_data if tag]
        record['tags'] = tag_data
        return record

    def prepare_elastic_doc(self, video_id):

        elastic_doc_file = Path(self.output_template.format(video_id=video_id))
        
        scene_file = self.collection_dir / 'selected-frames' / video_id / f'{video_id}-scenes.csv'
        media_info_file = self.collection_dir / 'media-info' / f'{video_id}.json'
        str_object_file = self.collection_dir / 'str-objects' / video_id / f'{video_id}-str-objects.jsonl.gz'
        ocr_object_file = self.collection_dir / 'objects-ocr' / video_id / f'{video_id}-objects-ocr.jsonl.gz'

        asr_file = self.collection_dir / 'asr'/ f'{video_id}-asr.csv'
        object_tag_file = self.collection_dir / 'objects-tags' / video_id / f'{video_id}-tags.jsonl.gz'

        media_data = self.load_json(json_path = media_info_file)
        asr_data = self.read_csv(asr_file)
        with open(scene_file, newline="") as f:
            scene_data = list(csv.DictReader(f))

        if not self.force and elastic_doc_file.exists():
            print(f'Skipping Lucene document creation, using existing file:', elastic_doc_file.name)
            return 0
        
        elastic_doc_file.parent.mkdir(parents=True, exist_ok=True)

        records = []

        with gzip.open(str_object_file, 'rt') as f:
            str_data = [json.loads(line) for line in f]

        with gzip.open(ocr_object_file, 'rt') as f:
            ocr_data = [self.process_ocr_data(json.loads(line)) for line in f]
        
        with gzip.open(object_tag_file, 'rt') as f:
            tag_data = [self.process_tag_data(json.loads(line)) for line in f]

        if not (len(str_data) == len(ocr_data) == len(tag_data)):
            raise ValueError(f"Length mismatch {video_id}: str_data ({len(str_data)}), ocr_data ({len(ocr_data)}), tag_data ({len(tag_data)})")
        
        for a,b,c in zip(str_data, ocr_data, tag_data):
            assert a["_id"] == b["_id"] == c["_id"]

        merged_data = [{**str_obj, **ocr_obj, **tag_obj} for str_obj, ocr_obj, tag_obj in zip(str_data, ocr_data, tag_data)]

        for data in merged_data:

            record = {}

            frame_id = int(data['_id'].split('-')[-1])

            record['imgID'] = data['_id']
            record['videoID'] = video_id
            record['collection'] = 'collection'

            scene_info = self.find_image_info(scene_data, media_data, asr_data, frame_id)
            record.update(scene_info)

            record['object_pos'] = data['object_box_str']
            record['object_count'] = data.pop('object_count_str')
            record['objectsinfo'] = data.pop('object_info')

            record['ocr'] = data.pop('ocr')
            record['tags'] = data.pop('tags')

            records.append(record)
        
        with gzip.open(elastic_doc_file, 'wt') as out:
            for record in records:
                out.write(json.dumps(record) + '\n')
    
    def prepare_all_docs(self):

        for video_id in tqdm(self.video_ids, desc="Đang chuẩn bị docs cho elastic: "):

            self.prepare_elastic_doc(video_id)
        print(f'Hoàn tất chuẩn bị {len(self.video_ids)} docs')

def parser_args():
    parser = argparse.ArgumentParser(description="Preprocessing Elastic docs")

    parser.add_argument('--video-ids', default="./collection_dir/video_ids.txt", type=Path)
    parser.add_argument('--output-template', default="./collection_dir/elastic-documents/{video_id}/{video_id}-elastic-docs.jsonl.gz", type=str)
    parser.add_argument('--collection-dir', default="./collection_dir", type=Path)
    parser.add_argument('--force', default=False, action="store_true")

    args = parser.parse_args()
    return args

if __name__ == "__main__":
    args = parser_args()

    processor = PrepareElasticDocs(args.video_ids, args.output_template, args.collection_dir, args.force)

    processor.prepare_all_docs()

    # python -m scripts.prepare_elastic_docs
                

                






