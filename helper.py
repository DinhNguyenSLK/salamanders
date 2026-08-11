from pathlib import Path
import collections
import concurrent.futures
import csv
import gzip
import json
from pathlib import Path
import tempfile
import threading
import itertools
import numpy as np
import pandas as pd
from tqdm import tqdm

# from sympy import fps

def copy_scenes_file():
    src = Path("data/metadata/shot_metadata")

    for csv_file in src.glob("*.csv"):
        dst = Path("collection_dir/selected_frames") / str(csv_file.name).split(".")[0] / csv_file.name.replace(".csv", "-scenes.csv")
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            print(f"{dst} already exists, skipping.")
            return
        dst.write_text(csv_file.read_text())

def copy_keyframes_file():
    src = Path("data/metadata/shot_keyframes_mapping")

    for txt_file in list(src.glob("L21*.txt")) + list(src.glob("L23*.txt")):
        dst = Path("collection_dir/selected_frames") / str(txt_file.name).split(".")[0] / txt_file.name.replace(".txt", "-keyframes.txt")
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            print(f"{dst} already exists, skipping.")
            return
        dst.write_text(txt_file.read_text())
from pathlib import Path
import subprocess
import json
import statistics

def is_cfr_fast(video_path):
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        str(video_path),
    ]

    data = json.loads(
        subprocess.check_output(cmd, text=True)
    )

    stream = data["streams"][0]

    return (
        stream["avg_frame_rate"]
        ==
        stream["r_frame_rate"]
    )


def check_cfr_all():
    video_dir = Path("collection_dir/videos")

    for video_path in video_dir.glob("*/*.mp4"):
        try:
            is_cfr_flag = is_cfr_fast(video_path)

            print(
                f"{video_path.name}: "
                f"{'CFR' if is_cfr_flag else 'VFR'} "
        
            )

        except Exception as e:
            print(f"{video_path.name}: ERROR -> {e}")

def create_video_ids_list():
    video_dir = Path("collection_dir/selected-frames")
    video_ids = [p.stem for p in video_dir.iterdir() if p.is_dir()]

    with open('./collection_dir/video_ids.txt', 'w') as f:
        for video_id in video_ids:
            f.writelines(str(video_id) + "\n")

def object_count(force=False, progress=None):
    """ Computes the total count of objects in all videos and saves it to a CSV file.

    Args:
        force (bool, optional): Whether to replace existing output or skip computation. Defaults to False.

    """

    count_objects_dir =Path('./collection_dir') / 'count-objects'
    count_objects_dir.mkdir(parents=True, exist_ok=True)
    count_objects_file =Path('./collection_dir') / 'objects_doc_freq.csv'

    if not force and count_objects_file.exists():
        print(f'Skipping object count, using existing file:', count_objects_file.name)
        return 0

    # count objects
    count = collections.Counter()
    for count_file in count_objects_dir.glob('*/*-count-objects.json'):
        with count_file.open('r') as f:
            count += collections.Counter(json.load(f))
            if progress:
                progress()

    # save to CSV in alphabetical order
    with count_objects_file.open('w') as f:
        writer = csv.writer(f)
        for key in sorted(count.keys()):
            writer.writerow([key, count[key]])  

def extract_fps_from_mapping():

    input_dir = Path('./collection_dir/map_kf_BTC')
    media_input = Path('./collection_dir/media-info')
    

    for csv_file in tqdm(sorted(input_dir.glob('*.csv'))):
        video_id = csv_file.stem

        data = pd.read_csv(csv_file)
        fps = None

        for row in data.itertuples():

            if fps is None:
                fps = row.fps
            else:
                if fps != row.fps:
                    print('FPS khasc nhau trong cung video')
                    return
                fps = row.fps

        media_file = media_input / f'{video_id}.json'

        with open(media_file, 'r', encoding='latin1') as f:
            data = json.load(f)

        media_fps = data['fps']

        if media_fps != fps:
            print(video_id, 'Không khớp fps', f'media: {media_fps} - fps: {fps}')
            
if __name__=="__main__":
    # copy_scenes_file()
    # check_cfr_all()
    # create_video_ids_list()
    # object_count()
    extract_fps_from_mapping()