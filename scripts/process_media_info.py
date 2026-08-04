import json
from pathlib import Path
import subprocess
from tqdm import tqdm
import argparse
from fractions import Fraction

class PreprocessingMetadata:
    """
    Bổ sung thêm 2 trường video_id và fps vào video metadata mà BTC cung cấp
    """
    def __init__(self, input_dir, video_dir):
        self.input_dir = input_dir
        self.video_dir = video_dir
        self.rule = {
            "L21" : "news",
            "L23" : "cycling"
        }
    def get_fps(self, video_path):
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=avg_frame_rate',
            '-of', 'csv=p=0',
            video_path  
            ]
        result = subprocess.run(cmd,  stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        fps = result.stdout.strip()
        return float(Fraction(fps))
    
    def load_json(self, json_path):

        for encoding in ["utf-8", "cp1252", "latin1"]:
            try:
                with open(json_path, "r", encoding=encoding) as f:
                    return json.load(f)
            except UnicodeDecodeError:
                
                continue

        raise ValueError(f"Khong doc duoc file {json_path}")
    
    def process_one(self, json_path):

        video_id = json_path.stem
        video_path = self.video_dir / str(video_id).split('_')[0] / (video_id + '.mp4')

        video_type = str(video_id).split('_')[0]

        if not video_path.exists():
            print(f'Video path {str(video_path)} ko ton tai')
            return

        data = self.load_json(json_path)
        
        if not isinstance(data, dict):
            raise TypeError(f"Dữ liệu {json_path} phải là dict")
        
        data['video_id'] = video_id
        data['video_type'] = self.rule.get(video_type, "unknown")
        if "fps" not in data:
            data['fps'] = self.get_fps(video_path)

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    
    def process_all(self):

        for p in tqdm(self.input_dir.glob('*.json'), desc="preprocessing video metadat .... "):
            
            self.process_one(p)

def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument('-i', '--input-dir', default="./collection_dir/media-info", type=Path)
    parser.add_argument('-v', '--video_dir', default="./collection_dir/videos", type=Path)
    
    args = parser.parse_args()

    return args 

if __name__ == "__main__":

    args = parse_args()

    processor = PreprocessingMetadata(input_dir=args.input_dir, video_dir=args.video_dir)
    processor.process_all()

    # python -m scripts.process_media_info