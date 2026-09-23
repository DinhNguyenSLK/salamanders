from flask import Flask, abort, send_from_directory
from pathlib import Path
import re

app = Flask(__name__)

COLLECTION_ROOT = Path(__file__).resolve().parents[1] / 'collection_dir'
THUMBNAIL_ROOT = COLLECTION_ROOT / 'thumbnails' / 'thumbnails'
KEYFRAME_ROOT = COLLECTION_ROOT / 'selected-frames'
VIDEO_ROOT = Path('D:/videos')
TINY_VIDEO_ROOT = COLLECTION_ROOT / 'resized-videos' / 'tiny'


def find_video(video_filename):
    match = re.match(r'^(L\d+)_', video_filename)
    if not match:
        return None

    collection_id = match.group(1)
    for collection_dir in VIDEO_ROOT.glob(f'Videos_{collection_id}_*'):
        video_path = collection_dir / 'video' / video_filename
        if video_path.is_file():
            return video_path

    return None

@app.route('/thumbnails/<path:filepath>')
def getThumbnail(filepath):
    print(filepath)
    return send_from_directory(THUMBNAIL_ROOT, filepath)

@app.route('/keyframes/<path:filepath>')
def getKeyframes(filepath):
    return send_from_directory(KEYFRAME_ROOT, filepath)

@app.route('/medium_video/<path:filepath>')
def getMediumVideo(filepath):
    video_filename = Path(filepath).name
    video_path = find_video(video_filename)
    if video_path is None:
        abort(404)
    return send_from_directory(video_path.parent, video_path.name)


@app.route('/tiny_video/<path:filepath>')
def getTinyVideo(filepath):
    return send_from_directory(TINY_VIDEO_ROOT, filepath)


if __name__ == "__main__":
    app.run(debug=True, port = 5000)
