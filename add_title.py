import json
from pathlib import Path
import csv

MEDIA_DIR = Path("./collection_dir/media-info")
ASR_DIR = Path("./collection_dir/semantic-asr")

for json_file in MEDIA_DIR.glob("*.json"):
    video_id = json_file.stem

    if video_id.split("_")[0] != "L26":
        continue

    csv_file = ASR_DIR / f"{video_id}-asr.csv"

    if not csv_file.exists():
        continue

    title = json.loads(json_file.read_text(encoding="utf-8"))["title"]

    with csv_file.open("r", encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
        fieldnames = rows[0].keys() if rows else []

    for row in rows:
        row["content"] = f'{row["content"]}. {title.replace("VIVU TV", " ").replace("MÓN NGON MỖI NGÀY", " ").strip()}'

    with csv_file.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f'đã xử lý xong {video_id}')