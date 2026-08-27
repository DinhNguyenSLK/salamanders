import csv
from pathlib import Path
from tqdm import tqdm

forbidden_L25 = ["SIU", "Để có được thành công như hôm nay", "tôi đã có những ước mơ", "và tôi đã hiện thực hóa ước mơ của mình", "Trường Đại học Quốc tế Sài Gòn", "S.I.U",
"tạo đa dạng, đa lĩnh vực", "cơ hội lựa chọn nghề nghiệp", "sinh viên đều có cơ hội", "tôi đã được truyền cảm hứng", "môi trường lý tưởng", "triết lý giáo dục mà ",
"lúc vương xa hơn những gì", "Quốc tế Á", "giữ gìn bản sắc và những giá trị", "Trường Quốc tế Á Châu", "bằng giữa học thuật và nghệ thuật",
"rõ mục đích giáo dục không chỉ", "Học bổng", "SIU,", "S.I.U.", "viết nên câu chuyện tương lai", "không phải là chuẩn bị cho cuộc sống", "Á Châu", "phản biện các vấn đề để", "đây với tôi còn hơn cả một", "giúp chúng tôi đặt những viên gạch đầu tiên"

                 ]

def merge_segments_greedy(path, threshold):
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

        # if any(fb in curr_text or fb in prev_text for fb in forbidden_L25):
        #     continue

        if not prev_text or not curr_text:
            continue

        if  (float(rows[t][0]) - float(rows[t-1][1]) <= threshold) and len(prev_text) + len(curr_text) <= 500 :
    

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

    ASR_INPUT_DIR = Path("./collection_dir/asr_chunkformer/L26")
    ASR_OUT_DIR = Path("./collection_dir/semantic-asr")

    if not ASR_OUT_DIR.exists():
        ASR_OUT_DIR.mkdir(parents=True, exist_ok=True)

    asr_files = ASR_INPUT_DIR.glob("*-asr.csv")

    for file in tqdm(list(asr_files)):
        
        file_name = file.name
        output_path = ASR_OUT_DIR / file_name
        rows = merge_segments_greedy(file, 0.5)

        save_csv(rows, output_path)


    # python -m scripts.merged_asr_chunkformer
    

        

