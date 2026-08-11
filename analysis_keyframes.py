from pathlib import Path
from collections import defaultdict

def count_num_keyframes(file_path):
    num = 0
    with open(file_path, 'r') as f:
        lines = f.readlines()
        for line in lines:
            num += int(len(line.strip().split()[1:]))
    print(f"{file_path.stem} has {num} keyframes")
    return num

def cal_distance(file_path):
    all_keyframes = []
    with open(file_path, 'r') as f:
        lines = f.readlines()
        for line in lines:
            keyframes = line.strip().split()[1:]
            keyframes = [int(kf) for kf in keyframes]
            all_keyframes.extend(keyframes)
    max_distance = 0
    a =b =0
    for i in range(1, len(all_keyframes)):
        prev_keyframes = all_keyframes[i - 1]
        curr_keyframes = all_keyframes[i]
        distance = curr_keyframes - prev_keyframes
        if distance > max_distance:
            max_distance = distance
            a=prev_keyframes
            b=curr_keyframes
    
    print(f"{file_path.stem} has max distance {max_distance} between keyframes {a} and {b}")
    print(" ------------------------ ")
    return max_distance, a, b

def cal_video():
    video_dir = Path("./collection_dir/videos")

    for i in video_dir.iterdir():
        print(f"{i.stem} has {len(list(i.glob('*.mp4')))} videos")

if __name__ == "__main__":
    # cal_video()
    # python analysis_keyframes.py
    total = 0
    for file_path in Path("./collection_dir/keyframes-info/L29").glob("*-keyframes.txt"):
        num = count_num_keyframes(file_path)
        total += num
        cal_distance(file_path)
    print(f"Total keyframes in {file_path.parent.stem}: {total}")