from flask import Flask, send_from_directory
from pathlib import Path

app = Flask(__name__)

VIDEO_ROOT = Path(__file__).resolve().parents[1] / 'collection_dir' / 'videos'

collection_root = Path(__file__).resolve().parents[1] / 'collection_dir'

@app.route('/thumbnails/<path:filepath>')
def getThumbnail(filepath):
    print(filepath)
    return send_from_directory(collection_root / 'thumbnails/', filepath)

@app.route('/keyframes/<path:filepath>')
def getKeyframes(filepath):
    return send_from_directory(collection_root / 'selected-frames/', filepath)

@app.route('/medium_video/<path:filepath>')
def getMediumVideo(filepath):
    
    return send_from_directory(collection_root / "resized-videos/medium", filepath)

@app.route('/tiny_video/<path:filepath>')
def getTinyVideo(filepath):
    return send_from_directory('G:/salamanders/collection_dir/resized-videos/tiny/', filepath)


if __name__ == "__main__":
    app.run(debug=True, port = 5000)
