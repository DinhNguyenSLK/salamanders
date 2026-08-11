from pathlib import Path
import argparse
import subprocess

def create_faiss(feature_name):
    
    INPUT_FEATURE = Path('./collection_dir') / f'features-{feature_name}'

    INDEX_FILE = Path("./collection_dir") / f'faiss-index_{feature_name}.faiss'
    IDMAP_FILE = Path("./collection_dir") / f'faiss-idmap_{feature_name}.txt'

    cmd = [
        'python',
        '-m', 'index.faiss_index_manager.build',
        str(INDEX_FILE),
        str(IDMAP_FILE),
        '--features_name', feature_name, 
        'create',
        str(INPUT_FEATURE),
        '--force'

    ]

    subprocess.run(cmd)


if __name__ == "__main__":
    features_name = ['metaclip2', 'siglip2', 'align', 'dinov2']
    create_faiss(features_name[0])

    # python -m scripts.index_faiss