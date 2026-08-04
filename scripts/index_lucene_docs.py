import argparse
from pathlib import Path
import subprocess

class IndexLucene:

    def __init__(self, jar_path, index_dir, video_ids_path, documents_file_template):
        self.jar_path = jar_path
        self.index_dir = index_dir
        self.video_ids_path = video_ids_path
        self.documents_file_template = documents_file_template

    def create_jar_file(self):
        
        if not self.jar_path.exists():
            pom_dir = self.jar_path.parent.parent

            cmd = subprocess.run(
                [
                    'mvn',
                    'package',
                    '-DskipTests',
                ],
                cwd = pom_dir
            )
            print('Build successful !!')
        else:
            print('Target folder exists ...')

    def index_all(self):

        cmd = [
            'java', '-jar',
            str(self.jar_path),
            str(self.index_dir),
            'add',
            '--video-ids-list-path', str(self.video_ids_path),
            str(self.documents_file_template)
        ]

        subprocess.run(cmd)

def parse_args():
    parser = argparse.ArgumentParser(description='Indexing lucene')

    parser.add_argument('--jar-path', 
                       default='services/index/lucene_index_manager/target/index-manager-1.0-jar-with-dependencies.jar',
                       type=Path
                       )
    parser.add_argument('--index-dir', default="collection_dir/lucene-index", type=Path)
    parser.add_argument("--video-ids-path", default = "./collection_dir/video_ids.txt", type=Path)
    parser.add_argument('--documents-file-template', default='collection_dir/lucene-documents/{video_id}/{video_id}-lucene-docs.jsonl.gz', type=str)

    args = parser.parse_args()
    return args

if __name__ == "__main__":
    args = parse_args()

    indexing =  IndexLucene(args.jar_path, args.index_dir, args.video_ids_path, args.documents_file_template)
    indexing.index_all()
    # python -m client.index_lucene_docs