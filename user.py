import gzip
from pathlib import Path

total = 0
for file in Path('./collection_dir/elastic-documents').glob("*/*-elastic-docs.jsonl.gz"):
    with gzip.open(file, 'rb') as f:
        data = f.readlines()
        total += len(data)
print(total)

# with open('./collection_dir/video_ids.txt', 'w') as f:
#     for video_id in sorted(list(Path('./collection_dir/videos').glob("*/*.mp4"))):

#         f.write(video_id.stem + "\n")

import csv
from tqdm import tqdm

def check_csv_lines(file_path):
    with open(file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        lines = list(reader)

        if len(lines) < 10:
            print(f"File {file_path.stem} có ít hơn 10 dòng.")
        

# # Ví dụ sử dụng
# for csv_file in tqdm(list(Path('./collection_dir/asr').glob('*/*.csv'))):
#     check_csv_lines(csv_file)
