import csv
import re
from pathlib import Path
from tqdm import tqdm

def get_first_letter(text):
    m = re.search(r'[A-Za-zÀ-ỹĐđ]', text)
    return m.group(0) if m else ''


def get_first_word(text):
    m = re.search(r"[A-Za-zÀ-ỹĐđ]+", text)
    return m.group(0) if m else ""

MAX_WORDS = 180
MAX_SECONDS = 45.0

def merge_segments_greedy(path, viet_dict, hard=False):
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        rows = [
            [
                row["start_seconds"],
                row["end_seconds"],
                row["content"].strip(),
            ]
            for row in reader
        ]

    for t in range(1, len(rows)):
        if rows[t] is None or rows[t - 1] is None:
            continue

        prev_text = rows[t - 1][2]
        curr_text = rows[t][2]

        if not prev_text or not curr_text:
            continue

        first_char = get_first_letter(curr_text)
        first_word = get_first_word(curr_text)

        last_char = prev_text.rstrip()[-1]

        # Có dấu kết thúc + bắt đầu bằng chữ hoa
        # => xem như sang câu mới
        if first_char.isupper() and last_char in ".!?…":
            continue

        if hard and first_char.isupper() and first_word.lower() in viet_dict:
            continue

        merged_text = prev_text + " " + curr_text

        merged_words = len(merged_text.split())

        merged_duration = (
            float(rows[t][1]) -
            float(rows[t-1][0])
        )

        if (
            (first_char.islower() and last_char not in ".!?…")
            or
            (
                merged_words <= MAX_WORDS
                and merged_duration <= MAX_SECONDS
            )
        ):

             # Merge
            rows[t][0] = rows[t - 1][0]                      # start_seconds
            rows[t][2] = prev_text.strip() + " " + curr_text.strip()         # content
            
            rows[t - 1] = None
        

    rows = [row for row in rows if row is not None]

    return rows

def save_csv(rows, output_path):
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # ghi header
        writer.writerow([
            "start_seconds",
            "end_seconds",
            "content"
        ])

        # ghi data
        for row in rows:
            writer.writerow(row)

if __name__ == "__main__":
    with open('./collection_dir/all-vietnamese-syllables.txt', 'r', encoding='utf-8') as f:
        data = f.readlines()
        data = [i.strip("\n") for i in data]
        
        viet_dict = set(data)

    ASR_INPUT_DIR = Path("./collection_dir/asr")
    ASR_OUT_DIR = Path("./collection_dir/merged-asr")

    if not ASR_OUT_DIR.exists():
        ASR_OUT_DIR.mkdir(parents=True, exist_ok=True)

    asr_files = ASR_INPUT_DIR.glob("*-asr.csv")

    for file in tqdm(list(asr_files)):
        file_name = file.name
        output_path = ASR_OUT_DIR / file_name
        rows = merge_segments_greedy(file, viet_dict)

        save_csv(rows, output_path)


    # python -m scripts.merged_asr
    

        

