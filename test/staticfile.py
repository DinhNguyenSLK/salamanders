from flask import Flask, send_from_directory
from pathlib import Path

app = Flask(__name__)
COLLECTION_DIR = Path(__file__).resolve().parent.parent / "collection_dir"
THUMBNAILS_DIR = COLLECTION_DIR / "thumbnails" / "thumbnails"
KEYFRAMES_DIR = COLLECTION_DIR / "selected-frames"
MEDIUM_VIDEOS_DIR = COLLECTION_DIR / "resized-videos" / "medium"
TINY_VIDEOS_DIR = COLLECTION_DIR / "resized-videos" / "tiny"

@app.route('/thumbnails/<path:filepath>')
def getThumbnail(filepath):
    return send_from_directory(THUMBNAILS_DIR, filepath)

@app.route('/keyframes/<path:filepath>')
def getKeyframes(filepath):
    return send_from_directory(KEYFRAMES_DIR, filepath)

@app.route('/medium_video/<path:filepath>')
def getMediumVideo(filepath):
    return send_from_directory(MEDIUM_VIDEOS_DIR, filepath)


@app.route('/tiny_video/<path:filepath>')
def getTinyVideo(filepath):
    return send_from_directory(TINY_VIDEOS_DIR, filepath)


if __name__ == "__main__":
    app.run(port=5000)
