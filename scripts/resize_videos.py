
from pathlib import Path
import subprocess
import argparse
from tqdm import tqdm

class VideoResizer:
    """
    Resize videos của BTC về 2 kích thước:
        - video-tiny: 146x? (width=146, height=-2) - Dùng khi nhấp chuột vào ảnh để xem nội dung xung quanh frame đó
        - video-medium: ?x480 (width=-2, height=480) - Hiển thị toàn bộ video và căng chỉnh để chọn frame-id
    """

    def __init__(self, input_path: Path, output_path:Path, force: bool = False):
        self.input_path = input_path
        self.output_path = output_path
        self.tiny_video_size = (146, -2)     # (width, height)
        self.medium_video_size = (-2, 480)   # (width, height)
        self.force = force
    
    def resize_one(self, video_path: Path, output_tiny: Path, output_medium: Path):
        """
         CRF (Constant Rate Factor) là thang đo chất lượng:
        - Giá trị thấp hơn (ví dụ: 18-23) sẽ tạo ra video chất lượng cao hơn nhưng kích thước tệp lớn hơn.
        - Giá trị cao hơn (ví dụ: 28-35) sẽ tạo ra video chất lượng thấp hơn nhưng kích thước tệp nhỏ hơn.
          """
        if output_tiny is None or output_medium is None:
            output_tiny = self.output_path / "tiny" / video_path.with_suffix('.mp4').name
            output_medium = self.output_path / "medium" / video_path.with_suffix('.mp4').name

        if (output_tiny.exists() or output_medium.exists()) and not self.force:
            print(f"{video_path} Đã tồn tại, bỏ qua...")
            return
        
        tiny_w, tiny_h = self.tiny_video_size
        medium_w, medium_h = self.medium_video_size

        # decode video 1 lần, sau đó scale và encode 2 lần để tiết kiệm thời gian
        command = [
            'ffmpeg',
            '-hide_banner', '-loglevel', 'error',
             '-nostats',
            '-i', str(video_path),

            '-filter_complex',
            (
                f'[0:v]split=2[vtiny][vmed];'
                f'[vtiny]scale={tiny_w}:{tiny_h}:force_divisible_by=2[tinyv];'
                f'[vmed]scale={medium_w}:{medium_h}:force_divisible_by=2[medv]'
            ),

            '-map', '[tinyv]',
            '-map', '0:a?',
            '-fps_mode', 'passthrough',
            '-c:v', 'libx264', '-preset', 'superfast', '-crf', '25', '-movflags', '+faststart',  # slower: encode chậm, file nhỏ hơn
            '-c:a', 'aac', '-b:a', '128k',
            str(output_tiny),

            '-map', '[medv]',
            '-map', '0:a?',
            '-fps_mode', 'passthrough',
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-movflags', '+faststart',
            '-c:a', 'aac', '-b:a', '128k',
            str(output_medium),
        ]
        subprocess.run(command, check=True)

    def resize_all(self):
        output_tiny_dir = self.output_path / "tiny"
        output_medium_dir = self.output_path / "medium"
        output_tiny_dir.mkdir(parents=True, exist_ok=True)
        output_medium_dir.mkdir(parents=True, exist_ok=True)
        try:
            video_files = sorted(list(self.input_path.glob("*/*.mp4")))
            # print(video_files)
            bar = tqdm(video_files, desc="Resizing videos", colour="green")
            print(f"Tổng số video cần resize: {len(video_files)}")
            for video_path in bar:
                output_tiny = output_tiny_dir / video_path.with_suffix('.mp4').name
                output_medium = output_medium_dir / video_path.with_suffix('.mp4').name
                self.resize_one(video_path, output_tiny, output_medium)

                print(f"Đã resize xong: {video_path.stem}")

        except Exception as e:
            print(f"Error resizing video: {e}")

def main():
    parser = argparse.ArgumentParser(description="Resize videos to tiny and medium sizes.")
    parser.add_argument("--input_path", type=Path, default="./collection_dir/videos", help="Path to the input videos directory.")
    parser.add_argument("--output_path", type=Path, default="./collection_dir/resized-videos", help="Path to the output videos directory.")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing resized videos.")
    args = parser.parse_args()

    resizer = VideoResizer(args.input_path, args.output_path, args.force)
    resizer.resize_all()

if __name__ == "__main__":
    main()
    # Chạy:  python -m scripts.resize_videos


