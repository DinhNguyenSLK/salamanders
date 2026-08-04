from pathlib import Path
import argparse
import subprocess

def run_cmd():

    VIDEO_IDS_PATH = "./collection_dir/video_ids.txt"
    STR_OUTPUT_TEMPLATE = "./collection_dir/str-objects/{video_id}/{video_id}-str-objects.jsonl.gz"
    COUNT_OUTPUT_TEMPLATE = "./collection_dir/count-objects/{video_id}/{video_id}-count-objects.json"
    OBJECT_INPUT_TEMPLATES = [
                            "./collection_dir/objects-yolov8x-oiv7/{video_id}/{video_id}-objects-yolov8x-oiv7.jsonl.gz",  # dùng .gz
                            "./collection_dir/objects-colors/{video_id}/{video_id}-objects-colors.jsonl.gz",
                              ]

    command = [
            "python",
            '-m', "index.str-object-encoder.encode", "--force",
            "--video-ids-list-path", VIDEO_IDS_PATH,
            STR_OUTPUT_TEMPLATE,
            COUNT_OUTPUT_TEMPLATE,
               ] + OBJECT_INPUT_TEMPLATES
    
    result = subprocess.run(command, capture_output=True, text=True)

    print(result.stdout)
    print(result.sterr)
    
if __name__ == "__main__":
    run_cmd()
    #  python -m scripts.encode_objects
   

