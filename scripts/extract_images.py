import subprocess
from pathlib import Path
import argparse
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor, as_completed

class ImageExtractor:
    """
    - Trích xuất keyframes và thumbnails từ video dựa trên file mapping .txt đã có sẵn.
    - Bắt buộc đã có thông tin {video_id}-keyframes.txt và {video_id}-scenes.csv 
    """

    def __init__(self, input_dir: Path, output_dir: Path, thumbnail_dir: Path, keyframes_dir, force: bool = False):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.thumbnail_dir = thumbnail_dir
        self.keyframes_dir = keyframes_dir
        self.force = force

   
    def extract_one(
        self,
        video_path: Path,
        full_output_path: Path,
        thumbnail_path: Path,
        kf_ids: list[int],
    ):
        if not kf_ids:
            print(f"No keyframe ids found for {video_path.stem}, skipping...")
            return True
        video_id = video_path.stem

        # Dọn file tạm từ lần chạy trước
        for f in full_output_path.glob(f"{video_id}-tmp-*"):
            f.unlink(missing_ok=True)
        for f in thumbnail_path.glob(f"{video_id}-tmp-*"):
            f.unlink(missing_ok=True)

        full_existing = list(full_output_path.glob(f"{video_id}-[0-9]*.jpg"))
        thumb_existing = list(thumbnail_path.glob(f"{video_id}-[0-9]*.webp"))

        if (len(full_existing) == len(kf_ids) and len(thumb_existing) == len(kf_ids) and not self.force):
            print(f"Keyframes for {video_id} already exist, skipping...")
            return True

        if self.force:
            for f in full_existing:
                f.unlink(missing_ok=True)
            for f in thumb_existing:
                f.unlink(missing_ok=True)

        tmp_full_pattern = full_output_path / f"{video_id}-tmp-%05d.jpg"
        tmp_thumb_pattern = thumbnail_path / f"{video_id}-tmp-%05d.webp"

        
        select_expr = "+".join(f"eq(n\\,{fid})" for fid in kf_ids)

        vf = (
            f"select='{select_expr}',"
            f"split=2[full][thumbin];"
            f"[thumbin]scale=192:-2[thumb]"
        )

        cmd = [
            "ffmpeg",
            "-loglevel", "error",
            "-threads", "1",
            "-i", str(video_path),
            "-filter_complex", vf,

            "-map", "[full]",
            "-vsync", "vfr",
            "-q:v", "3",
            "-start_number", "1",
            str(tmp_full_pattern),

            "-map", "[thumb]",
            "-vsync", "vfr",
            "-c:v", "libwebp",
            "-quality", "80",
            "-start_number", "1",
            str(tmp_thumb_pattern),
        ]

        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error processing {video_id}: {e}")
            return False

       
        tmp_full_files = sorted(
            full_output_path.glob(f"{video_id}-tmp-*.jpg"),
            key=lambda p: int(p.stem.split("-tmp-")[-1])   # sort THEO SỐ
        )
        tmp_thumb_files = sorted(
            thumbnail_path.glob(f"{video_id}-tmp-*.webp"),
            key=lambda p: int(p.stem.split("-tmp-")[-1])
        )

        if (len(tmp_full_files) != len(kf_ids) or len(tmp_thumb_files) != len(kf_ids)):
            print(
                f"{video_id}: expected {len(kf_ids)} outputs, "
                f"got {len(tmp_full_files)} jpg and {len(tmp_thumb_files)} webp."
            )
            print(f"  → max fid = {max(kf_ids)}, kiểm tra xem có fid nào vượt quá tổng số frame thật của video.")
            return False

        # ---- Rename sang frame_id thật ----
        for tmp_full, tmp_thumb, fid in zip(tmp_full_files, tmp_thumb_files, kf_ids):
            real_full = full_output_path / f"{video_id}-{fid:05d}.jpg"
            real_thumb = thumbnail_path / f"{video_id}-{fid:05d}.webp"
            tmp_full.replace(real_full)
            tmp_thumb.replace(real_thumb)

        return True

    def extract_all(self, max_workers=4):
        video_paths = list(self.input_dir.glob("*.mp4"))

        futures = []

        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            for video_path in video_paths:
                video_id = video_path.stem

                full_output_path = self.output_dir / video_id
                thumb_output_path = self.thumbnail_dir / video_id

                full_output_path.mkdir(parents=True, exist_ok=True)
                thumb_output_path.mkdir(parents=True, exist_ok=True)

                keyframes_file = self.keyframes_dir / f"{video_id}-keyframes.txt"

                kf_ids = self.get_kf_ids(keyframes_file)
                if kf_ids is None:
                    print(f"No keyframe ids found for {video_id}, skipping...")
                    continue

                futures.append(
                    executor.submit(
                        self.extract_one,
                        video_path,
                        full_output_path,
                        thumb_output_path,
                        kf_ids,
                    )
                )

            progress_bar = tqdm(
                total=len(futures),
                desc="Extracting keyframes",
                colour="blue",
            )

            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    print(f"Worker failed: {e}")
                progress_bar.update(1)

            progress_bar.close()

    def get_kf_ids(self, keyframes_file: Path):
        if not keyframes_file.exists():
            print(f"Keyframe file {keyframes_file} does not exist for .")
            return None
        kf_ids = []
        with keyframes_file.open() as f:
            data = f.readlines()
            for line in data:
                kf_ids.extend([int(fid) for fid in line.strip().split()[1:]])
        return sorted(set(kf_ids))


def main():
    parser = argparse.ArgumentParser(description="Extract keyframes from videos")
    
    # Đổi path 2 chỗ này
    parser.add_argument("--input_dir", type=Path, default=Path("collection_dir/videos/L24"))
    parser.add_argument("--keyframes_dir", type=Path, default=Path("collection_dir/keyframes-info/L24"))


    parser.add_argument("--output_dir", type=Path, default=Path("collection_dir/selected-frames"))
    parser.add_argument("--thumbnail_dir", type=Path, default=Path("collection_dir/thumbnails"))
    parser.add_argument("--force", action="store_true")

    args = parser.parse_args()

    extractor = ImageExtractor(args.input_dir, args.output_dir, args.thumbnail_dir, args.keyframes_dir, force=args.force)
    extractor.extract_all()


if __name__ == "__main__":
    # python -m scripts.extract_images
    main()