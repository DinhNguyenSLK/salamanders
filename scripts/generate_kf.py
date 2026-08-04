import pandas as pd
import numpy as np
from pathlib import Path

def generate_lecture_keyframes(csv_path, output_txt):

    df = pd.read_csv(csv_path)

    with open(output_txt, "w") as f:
        for _, row in df.iterrows():
            shot_id = int(row["shot_id"])
            start = int(row["start_frame"])
            end = int(row["end_frame"])
            length = int(row["length_frames"])

            if length <= 50:
                # 1 frame ở giữa
                kfs = [(start + end) // 2]
            elif length <= 200:
                # 2 frame chia đều
                kfs = np.linspace(start, end, 2, dtype=int).tolist()
            elif length <= 1000:
                # length//100 + 1 frame chia đều
                n = length // 100 + 1
                kfs = np.linspace(start, end, n, dtype=int).tolist()
            else:
                # length//200 + 1 frame chia đều
                n = length // 200 + 1
                kfs = np.linspace(start, end, n, dtype=int).tolist()

            f.write(f"{shot_id} {' '.join(map(str, kfs))}\n")
def generate_cooking_keyframes(csv_path, output_txt):
    df = pd.read_csv(csv_path)

    with open(output_txt, "w") as f:
        for _, row in df.iterrows():
            shot_id = int(row["shot_id"])
            start = int(row["start_frame"])
            end = int(row["end_frame"])
            length = int(row["length_frames"])

            if length <= 40:
                step = 8
            elif length <= 80:
                step = 10
            elif length <= 200:
                step = 15
            else:
                step = 20

            kfs = list(range(start, end + 1, step))

            # Đảm bảo luôn có frame cuối
            if kfs[-1] != end:
                kfs.append(end)

            f.write(f"{shot_id} {' '.join(map(str, kfs))}\n")

if __name__ == "__main__":
    # python -m scripts.generate_kf
    scenes_dir = Path("./collection_dir/scene-info/L26")
    keyframes_dir = Path("./collection_dir/keyframes-info/L26")
    keyframes_dir.mkdir(parents=True, exist_ok=True)

    for file in scenes_dir.glob("*-scenes.csv"):
        video_id = file.stem.split("-")[0]
        output_txt = keyframes_dir / f"{video_id}-keyframes.txt"

        # if output_txt.exists():
        #     print(f"Keyframes for {video_id} already exist, skipping...")
        #     continue

        generate_cooking_keyframes(file, output_txt)
        print(f"Generated keyframes for {video_id} at {output_txt}")
    