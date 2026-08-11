import cv2
from pathlib import Path
from tqdm import tqdm

def get_video_duration(video_path):
    cap = cv2.VideoCapture(video_path)
    
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()

    return frames 


# Ví dụ
video_list = list(Path("./collection_dir/videos/L23").glob("*.mp4"))
total_frames = 0
for video_path in video_list:
    duration = get_video_duration(str(video_path))
    total_frames += duration
print(f"Tổng số frame trong tất cả video: {total_frames}")

kf = list(Path("./collection_dir/selected-frames").glob("*/*.jpg"))
print(f"Tổng số keyframe đã extract: {len(kf)}")