from pathlib import Path

def check_all_keyframes_increasing():
    file_list = list(Path("./collection_dir/keyframes-info").glob("*/*-keyframes.txt"))
    for file_path in file_list:
        all_keyframes = []
        with open(file_path, 'r') as f:
            lines = f.readlines()
            for line in lines:
                keyframes = line.strip().split()[1:]
                keyframes = [int(kf) for kf in keyframes]
                all_keyframes.extend(keyframes)
        for i in range(len(all_keyframes) - 1):
            if all_keyframes[i] > all_keyframes[i + 1]:
                print(f"{file_path.stem} has non-increasing keyframes at index {i}: {all_keyframes[i]} >= {all_keyframes[i + 1]}")
                return False
        
    print("All keyframes in all files are increasing.")

import subprocess
import json
from pathlib import Path


import subprocess
import re
from pathlib import Path


def check_pts_equals_frame_index(
    video_path: str | Path,
    num_samples: int = 20,
    verbose: bool = True,
):
    """
    Kiểm tra nhanh xem PTS có bằng frame index hay không
    bằng cách lấy một số frame mẫu.

    Returns
    -------
    (ok, mismatch)

    ok: bool

    mismatch:
        None nếu OK
        (frame_index, pts) nếu phát hiện sai
    """

    # ---------------------------------------------------
    # Lấy số frame
    # ---------------------------------------------------
    cmd = [
        "ffprobe",
        "-v", "error",
        "-count_frames",
        "-select_streams", "v:0",
        "-show_entries", "stream=nb_read_frames",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(video_path),
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=True,
    )

    total_frames = int(result.stdout.strip())

    if total_frames == 0:
        raise ValueError("Video has no frames.")

    # ---------------------------------------------------
    # Chọn frame mẫu
    # ---------------------------------------------------
    if total_frames <= num_samples:
        sample_ids = list(range(total_frames))
    else:
        step = (total_frames - 1) / (num_samples - 1)
        sample_ids = sorted(set(round(i * step) for i in range(num_samples)))

    last_frame = sample_ids[-1]

    # ---------------------------------------------------
    # Decode tới frame lớn nhất cần kiểm tra
    # ---------------------------------------------------
    cmd = [
        "ffmpeg",
        "-v", "info",
        "-i", str(video_path),
        "-vf", "showinfo",
        "-frames:v", str(last_frame + 1),
        "-f", "null",
        "-"
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=True,
    )

    pattern = re.compile(r"n:\s*(\d+).*?pts:\s*(-?\d+)")

    pts_map = {}

    for line in result.stderr.splitlines():
        m = pattern.search(line)
        if m:
            n = int(m.group(1))
            pts = int(m.group(2))
            pts_map[n] = pts

    # ---------------------------------------------------
    # So sánh
    # ---------------------------------------------------
    for fid in sample_ids:

        if fid not in pts_map:
            if verbose:
                print(f"Frame {fid} not decoded.")
            return False, (fid, None)

        if pts_map[fid] != fid:
            if verbose:
                print(
                    f"Mismatch: frame={fid}, pts={pts_map[fid]}"
                )
            return False, (fid, pts_map[fid])

    if verbose:
        print(
            f"Checked {len(sample_ids)} frames "
            f"(out of {total_frames}) -> PTS == frame index."
        )

    return True, None
    
import subprocess
import json

def check_cfr_and_timebase(video_path):
    """
    Kiểm tra nhanh (không decode) xem video có phải CFR với 
    time_base = 1/fps hay không — điều kiện đủ để PTS == frame_index.
    """
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=r_frame_rate,avg_frame_rate,time_base,nb_frames",
        "-of", "json",
        str(video_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    info = json.loads(result.stdout)["streams"][0]

    r_fps = info.get("r_frame_rate")
    avg_fps = info.get("avg_frame_rate")
    time_base = info.get("time_base")

    # CFR thật sự khi r_frame_rate == avg_frame_rate
    is_cfr = (r_fps == avg_fps)

    # time_base dạng "1/25" nghĩa là mỗi tick PTS = 1 frame ở 25fps
    tb_num, tb_den = map(int, time_base.split("/"))
    fps_num, fps_den = map(int, r_fps.split("/"))
    
    # PTS increment mỗi frame = time_base_den / fps  ->  cần = 1 tick/frame
    matches_frame_unit = (tb_den == fps_num and tb_num * fps_den == 1) or \
                         (fps_num / fps_den) == (tb_den / tb_num)
   
    return is_cfr, r_fps, avg_fps, time_base

def check_pts_fast(video_path, num_check_frames=30):
    cmd = [
        "ffmpeg", "-v", "info",
        "-i", str(video_path),
        "-vf", "showinfo",
        "-frames:v", str(num_check_frames),  # chỉ decode 30 frame đầu, không phải hàng trăm nghìn
        "-f", "null", "-"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    
    pattern = re.compile(r"n:\s*(\d+).*?pts:\s*(-?\d+)")
    for line in result.stderr.splitlines():
        m = pattern.search(line)
        if m:
            n, pts = int(m.group(1)), int(m.group(2))
            if n != pts:
                return False, (n, pts)
    return True, None

def can_use_frame_pts(video_path: str | Path,
                      check_frames: int = 100,
                      verbose: bool = True):
    """
    Kiểm tra nhanh xem có thể dùng '-frame_pts 1' để đặt tên file
    theo frame index hay không.

    Chỉ decode `check_frames` frame đầu tiên.

    Returns
    -------
    bool
        True  -> trong các frame đã kiểm tra: PTS == frame index
        False -> phát hiện khác nhau
    """

    cmd = [
        "ffmpeg",
        "-v", "info",
        "-i", str(video_path),
        "-vf", "showinfo",
        "-frames:v", str(check_frames),
        "-f", "null",
        "-"
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        if verbose:
            print(e.stderr)
        return False

    pattern = re.compile(r"n:\s*(\d+)\s+pts:\s*(-?\d+)")

    checked = 0

    for line in result.stderr.splitlines():
        m = pattern.search(line)
        if not m:
            continue

        n = int(m.group(1))
        pts = int(m.group(2))

        checked += 1

        if n != pts:
            if verbose:
                print(
                    f"Mismatch: frame={n}, pts={pts}, video={video_path.stem}"
                )
            return False

    if checked == 0:
        if verbose:
            print("No showinfo output found.")
        return False

    if verbose:
        print(f"Checked {checked} frames: PTS == frame index")

    return True

def smart_check(video_path):
    ok = can_use_frame_pts(video_path, check_frames=100, verbose=True)

    if ok:
        return
    else:
        print("Không nên dùng -frame_pts 1")

import cv2
def has_video_over_100k_frames(video_dir: Path, threshold: int = 100000):
    for video_path in video_dir.glob("*.mp4"):
        cap = cv2.VideoCapture(str(video_path))
        n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()

        if n_frames >= threshold:
            print(f"{video_path.name}: {n_frames:,} frames")


def find_shots_max_frames(k):
    file_list = list(Path("./collection_dir/keyframes-info").glob("*/*-keyframes.txt"))
    for file_path in file_list:
        with open(file_path, 'r') as f:
            lines = f.readlines()
            for line in lines:
                parts = list(map(int, line.split()))
                shot_id, frames = parts[0], parts[1:]
                if len(frames) >= k:
                    print(f"{file_path.stem} has shot {shot_id} with {len(frames)} frames. start frame: {frames[0]}, end frame: {frames[-1]}")
def check_image_exists():
    keyframes_dir = Path("./collection_dir/keyframes-info/L22")
    image_dir = Path("./collection_dir/selected-frames")

    for keyframe_file in tqdm(list(keyframes_dir.glob("*-keyframes.txt"))):
        video_id = keyframe_file.stem.split("-")[0]
        image_subdir = image_dir / video_id

        if not image_subdir.exists():
            print(f"Image directory for {video_id} does not exist.")
            continue

        with open(keyframe_file, 'r') as f:
            lines = f.readlines()
            for line in lines:
                parts = list(map(int, line.split()))
                shot_id, frames = parts[0], parts[1:]
                for frame in frames:
                    image_path = image_subdir / f"{video_id}-{frame:05d}.jpg"
                    if not image_path.exists():
                        print(f"Missing image: {image_path}") 
                        return
    print("All images exist for the keyframes listed in the text files.") 

def check_dataset(root_dir='./collection_dir/selected-frames'):
    import re

    VIDEO_ID_PATTERN = re.compile(r"^L\d{2}_V\d{3}$")
    IMAGE_PATTERN = re.compile(r"^(L\d{2}_V\d{3})-(\d{5})\.jpg$")
    root_dir = Path(root_dir)

    total_folders = 0
    total_images = 0
    errors = []

    for video_dir in tqdm(sorted(root_dir.iterdir())):
        if not video_dir.is_dir():
            continue

        total_folders += 1
        video_id = video_dir.name

        # Kiểm tra tên folder
        if not VIDEO_ID_PATTERN.fullmatch(video_id):
            errors.append(f"[Folder] Invalid folder name: {video_dir}")

        for img_path in sorted(video_dir.iterdir()):
            if not img_path.is_file():
                continue

            total_images += 1

            m = IMAGE_PATTERN.fullmatch(img_path.name)

            # Sai format tên file
            if m is None:
                errors.append(f"[File] Invalid filename: {img_path}")
                continue

            file_video_id, frame_id = m.groups()

            # Prefix không khớp tên folder
            if file_video_id != video_id:
                errors.append(
                    f"[Mismatch] Folder={video_id}, File={img_path.name}"
                )
    print(f"Checked {total_folders} folders")
    print(f"Checked {total_images} images")
    print(f"Found {len(errors)} errors")

    if errors:
        print("\n===== ERROR LIST =====")
        for e in errors:
            print(e)

    return errors

def count_kf_per_video():
    kf_dir = Path("./collection_dir/selected-frames")
    c = {}
    for video_dir in kf_dir.iterdir():
        if not video_dir.is_dir():
            continue
        video_id = video_dir.name
        num_kf = len(list(video_dir.glob("*.jpg")))
        c[video_id] = num_kf
    with open("keyframe_count.json", "w") as f:
        json.dump(c, f, indent=4)

def check_size():
    import h5py
    import numpy as np

    folder = Path("./collection_dir/features-siglip2")
    total_vector = 0
    size = None
    for file in tqdm(sorted(folder.glob("*/*.hdf5")), desc = "Check size file hdf5"):

        if file.stat().st_size/1024 <= 100:
            print(f'{file.stem} is low size')

        with h5py.File(file, 'r') as f:
            data = np.array(f['data'])

            if size is None:
                size = data.shape[1]

            if data.shape[1] != size:
                print("SIZE VECTOR KHONG KHOP !!!!!!!!!!!!!!!!!!!!!")
                return

            total_vector += data.shape[0]
    print(f'Tổng số vector {total_vector} với size {size}')


if __name__ == "__main__":
    from tqdm import tqdm
    check_size()
    for file_path in tqdm(sorted(list(Path("./collection_dir/selected-frames").glob("*/*.jpg")))):
        if len(file_path.stem) != 14:
            print(f"Invalid filename length: {file_path}")
       
    # check_image_exists()
    check_dataset()
    video_dir = sorted(list(Path("./collection_dir/videos").glob("**/*.mp4")))
    for video_path in tqdm(video_dir):
        has_video_over_100k_frames(video_path)
    count_kf_per_video()
    check_all_keyframes_increasing()
    find_shots_max_frames(100)