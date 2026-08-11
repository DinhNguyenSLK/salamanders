from flask import Flask, send_from_directory

app = Flask(__name__)

@app.route('/thumbnails/<path:filepath>')
def getThumbnail(filepath):
    print(filepath)
    return send_from_directory('G:/salamanders/collection_dir/thumbnails/', filepath)

@app.route('/keyframes/<path:filepath>')
def getKeyframes(filepath):
    return send_from_directory('G:/salamanders/collection_dir/selected-frames/', filepath)

@app.route('/medium_video/<path:filepath>')
def getMediumVideo(filepath):
    return send_from_directory('G:/salamanders/collection_dir/resized-videos/medium/', filepath)


@app.route('/tiny_video/<path:filepath>')
def getTinyVideo(filepath):
    return send_from_directory('G:/salamanders/collection_dir/resized-videos/tiny/', filepath)


if __name__ == "__main__":
    app.run(debug=True, port = 5000)