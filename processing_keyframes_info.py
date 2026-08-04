from pathlib import Path


def augment_keyframes(txt_file: str | Path, K: int):
    txt_file = Path(txt_file)

    shots = []
    final_shot = None
    with open(txt_file, "r") as f:
        for line in f:
            parts = list(map(int, line.split()))
            shots.append([parts[0], parts[1:]])
            final_shot = parts[0]

    prev_last = None
    c = 0

    for shot, frames in shots:
        
        if shot == final_shot:
            break
        # bỏ qua những shot có số lượng frame >= 50
        if len(frames) >= 50:
            prev_last = frames[-1]
            continue

        new_frames = []
        
        for cur in frames:
            if prev_last is not None:
                dist = cur - prev_last
                if dist >= K:
                    n = dist // K
                    
                    c += n
                    step = dist // (n + 1)
                    new_frames.extend(prev_last + step * i for i in range(1, n + 1))

            new_frames.append(cur)
            prev_last = cur

        frames[:] = new_frames
        
        assert all(frames[i] < frames[i+1] for i in range(len(frames)-1))

    print('ghi file')
    with open(str(txt_file) , "w") as f:
        for shot_id, frames in shots:
            f.write(f"{shot_id} {' '.join(map(str, frames))}\n")

    print(f"Augmented {txt_file.stem} with {c} new keyframes.")

def remove_frames_before(txt_file: str | Path, K: int):
    txt_file = Path(txt_file)

    lines = []
    with open(txt_file, "r") as f:
        for line in f:
            parts = list(map(int, line.split()))
            
            shot_id, frames = parts[0], parts[1:]

            while frames and frames[0] <= K:
                frames.pop(0)

            lines.append((shot_id, frames))

    with open(txt_file, "w") as f:
        for shot_id, frames in lines:
            f.write(f"{shot_id}{' ' if frames else ''}{' '.join(map(str, frames))}\n")
if __name__ == "__main__":
    # python processing_keyframes_info.py
    
    for file_path in sorted(list(Path("./collection_dir/keyframes-info/L23").glob("*-keyframes.txt"))):
        augment_keyframes(file_path, 35)
    