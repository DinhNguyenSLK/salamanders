from flask import Flask, send_from_directory
from pathlib import Path

app = Flask(__name__)

VIDEO_ROOT = Path(__file__).resolve().parents[1] / 'collection_dir' / 'videos'

@app.route('/thumbnails/<path:filepath>')
def getThumbnail(filepath):
    print(filepath)
    return send_from_directory('G:/salamanders/collection_dir/thumbnails/', filepath)

@app.route('/keyframes/<path:filepath>')
def getKeyframes(filepath):
    return send_from_directory('G:/salamanders/collection_dir/selected-frames/', filepath)

@app.route('/medium_video/<path:filepath>')
def getMediumVideo(filepath):
    video_filename = Path(filepath).name
    prefix_video_id = Path(video_filename).stem.split('_', 1)[0]
    return send_from_directory(VIDEO_ROOT / prefix_video_id, video_filename)


@app.route('/tiny_video/<path:filepath>')
def getTinyVideo(filepath):
    return send_from_directory('G:/salamanders/collection_dir/resized-videos/tiny/', filepath)


if __name__ == "__main__":
    app.run(debug=True, port = 5000)
