import subprocess
from pathlib import Path

def run():
    INPUT_DIR = "collection_dir/selected-frames"
    FEATURE_NAME = "objects-colors"
    OUTPUT_TEMPLATE = './collection_dir/{feature_name}/{video_id}/{video_id}-{feature_name}.jsonl.gz'

    video_dir = Path(INPUT_DIR)
    video_ids_path =  [p for p in video_dir.iterdir() if p.is_dir()]

    for video_path in video_ids_path:
        print(f'==== Processing {video_path.stem} =========')
        cmd = [
            "python", '-m',
            "analysis.objects_colors.extract",
            str(video_path),
            'jsonl',
            '-n', FEATURE_NAME,
            '-o', OUTPUT_TEMPLATE
        ]
        subprocess.run(cmd)

if __name__ == "__main__":
    run()
    # python -m client.analysis_color
        


