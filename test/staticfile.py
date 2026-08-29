import os

from flask import Flask, abort, send_file, send_from_directory
from pathlib import Path

app = Flask(__name__)
COLLECTION_DIR = Path(__file__).resolve().parent.parent / "collection_dir"
THUMBNAILS_DIR = COLLECTION_DIR / "thumbnails" / "thumbnails"
KEYFRAMES_DIR = COLLECTION_DIR / "selected-frames"
# Video gốc được lưu ngoài repository. Có thể đổi thư mục bằng biến môi
# trường LOCAL_VIDEOS_DIR; mặc định là D:\videos.
LOCAL_VIDEOS_DIR = Path(os.environ.get("LOCAL_VIDEOS_DIR", r"D:\videos"))


def build_video_index() -> dict[str, Path]:
    """Lập chỉ mục tên file video để UI chỉ cần gửi `{videoId}.mp4`.

    Dataset có cấu trúc thư mục con (ví dụ: Videos_L21_a/video/L21_V001.mp4),
    trong khi frontend gọi URL phẳng `/medium_video/L21_V001.mp4`.
    """
    if not LOCAL_VIDEOS_DIR.is_dir():
        return {}

    video_index: dict[str, Path] = {}
    for video_path in sorted(LOCAL_VIDEOS_DIR.rglob("*.mp4")):
        # Một số batch có bản sao cùng video ID. Giữ file đầu tiên theo thứ tự
        # ổn định thay vì để thứ tự filesystem quyết định ngẫu nhiên.
        video_index.setdefault(video_path.name.casefold(), video_path)
    return video_index


VIDEO_INDEX = build_video_index()

@app.route('/thumbnails/<path:filepath>')
def getThumbnail(filepath):
    return send_from_directory(THUMBNAILS_DIR, filepath)

@app.route('/keyframes/<path:filepath>')
def getKeyframes(filepath):
    return send_from_directory(KEYFRAMES_DIR, filepath)

def get_local_video(filepath):
    # Chỉ nhận tên file để không cho phép path traversal qua URL.
    filename = Path(filepath).name
    if filename != filepath:
        abort(404)

    video_path = VIDEO_INDEX.get(filename.casefold())
    if video_path is None:
        abort(404, description=f"Video not found in {LOCAL_VIDEOS_DIR}: {filename}")
    return send_file(video_path, conditional=True)


@app.route('/medium_video/<path:filepath>')
def getMediumVideo(filepath):
    return get_local_video(filepath)


@app.route('/tiny_video/<path:filepath>')
def getTinyVideo(filepath):
    return get_local_video(filepath)


if __name__ == "__main__":
    app.run(port=5000)
