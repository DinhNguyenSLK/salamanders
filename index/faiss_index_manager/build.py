import argparse
import logging
from pathlib import Path
import re
import sys
from services.common import load_config
import faiss
import h5py
import more_itertools
import numpy as np
from tqdm import tqdm


"""
- Xử lý nhiều video cùng lúc: thông tin mỗi video lưu trong .hdf5 riêng, sau đó tạo index từ tất cả các file .hdf5 này.
- faiss_index_file: Là MỘT FILE DUY NHẤT chứa toàn bộ index của tất cả video đã được xử lý. 
                    Khi cần thêm video mới, chỉ cần tạo file .hdf5 cho video đó rồi add vào index mà không cần tạo lại toàn bộ index.
- idmap_file: file .txt chứa mapping giữa frame_id trong index và video/frame tương ứng, để tiện cho việc thêm/bớt video sau này.
"""

def peek_features_attributes(args, h5file):
    with h5py.File(h5file, 'r') as f:
        features_dim = f['data'].shape[1]
        try:
            features_name = f.attrs['features_name']
        except KeyError:
            if args.features_name is not None:
                features_name = args.features_name
            else:
                raise ModuleNotFoundError('Khong tim thay feature name')
            
        return features_dim, features_name


def load_features(hdf5_files):
    progress = tqdm(total=len(hdf5_files), desc='Loading features')

    for hdf5_file in hdf5_files:
        with h5py.File(hdf5_file, 'r') as h5file:
            ids = h5file['ids'].asstr()[:]   # load ids as strings, not bytes b' , EX: ['L21_V001-00069', 'L21_V001-00070', ...]
            features = h5file['data'][:]

            progress.update(1)
            ids_and_features = zip(ids, features)
            # ids_and_features = progress(ids_and_features)

            yield from ids_and_features


def create(args):
    # skip if existing
    if not args.force and args.index_file.exists() and args.idmap_file.exists():

        # get number of lines in idmap file
        with open(args.idmap_file, 'r') as idmap_file:
            num_lines = sum(1 for line in idmap_file)

        print('Index already exists, skipping creation. Use --force to overwrite.')
        return

    # load features
    features_files = args.features_dir.glob('*/*.hdf5')  # Lấy all hdf5 files trong thư mục <features_name>
    features_files = sorted(features_files)
    ids_and_features = load_features(features_files)

    # peek features to get type and dimensionality
    dim, features_name = peek_features_attributes(args, features_files[0])

    # load configs
    config = load_config(args.config_file)['index']['features'][features_name]
    index_type = config['index_type']

    # create index
    #logging.info(f'Creating index: {index_type} dim={dim} ...')
    metric = faiss.METRIC_INNER_PRODUCT   # inner product + normalized vectors -> cosine similarity
    index = faiss.index_factory(dim, index_type, metric)  # build index với fixed dim 

    # train index if needed (peek a bunch of features)
    if not index.is_trained:
        train_ids_and_features, ids_and_features = more_itertools.spy(ids_and_features, args.train_size)
        train_ids, train_features = zip(*train_ids_and_features)
        train_features = np.stack(train_features)
        logging.info('Training index ...')
        index.train(train_features)
        logging.info('Index trained.')

    args.idmap_file.parent.mkdir(parents=True, exist_ok=True)  # ensure idmap directory exists
    # add elements to index in batches, write also idmap file
    batches_of_ids_and_features = more_itertools.batched(ids_and_features, args.batch_size)
    with open(args.idmap_file, 'w') as idmap_file:
        for batch_of_ids_and_features in batches_of_ids_and_features:
            batch_of_ids, batch_of_features = zip(*batch_of_ids_and_features)

            idmap_file.write('\n'.join(batch_of_ids))
            idmap_file.write('\n')

            batch_of_features = np.stack(batch_of_features)
            
            # batch_of_features /= np.linalg.norm(batch_of_features, axis=1, keepdims=True)
            faiss.normalize_L2(batch_of_features)
            index.add(batch_of_features)

    print('Index created.')

    # save index to disk
    print('Saving index ...')
    faiss.write_index(index, str(args.index_file))
    print('Index saved.')


def add(args):
    if args.index_file.exists() and args.idmap_file.exists():
        # load index and idmap
        index = faiss.read_index(str(args.index_file))
        with open(args.idmap_file, 'r') as lines:
            idmap = list(map(str.rstrip, lines))

    else: # there's no index, create an empty one
        # peek features to get type and dimensionality
        dim, features_name = peek_features_attributes(args.video_features_files[0])

        # load configs
        config = load_config(args.config_file)['index']['features'][features_name]
        index_type = config['index_type']

        # create index
        logging.info(f'Creating index: {index_type} dim={dim} ...')
        metric = faiss.METRIC_INNER_PRODUCT
        index = faiss.index_factory(dim, index_type, metric)

        idmap = []

    assert index.is_trained, "Cannot train index during incremental additions. Pick a index type that does not need training or try bulk-indexing."

    def _add_single_features_file(video_features_file, index, idmap):
        # load ids and features to be added
        with h5py.File(video_features_file, 'r') as h5file:
            ids = h5file['ids'].asstr()[:]

            positions = [i for i, x in enumerate(idmap) if x in ids]
            if not args.force and positions:  # frames with this video_id are present in the index
                print(f'Skipping adding to FAISS index, already present.')
                return index, idmap

            features = h5file['data'][:]

        if args.force and positions:  # when forcing, remove existing entries for this video from the index
            idmap = [x for i, x in enumerate(idmap) if i not in positions]
            index.remove_ids(np.array(positions))  # Các id bị xóa sẽ bị vô hiệu, các id còn lại được giữ nguyên vị trí 

        # add elements to index in batches
        ids_and_features = zip(ids, features)
        batches_of_ids_and_features = more_itertools.batched(ids_and_features, args.batch_size)

        for batch_of_ids_and_features in batches_of_ids_and_features:
            batch_of_ids, batch_of_features = zip(*batch_of_ids_and_features)

            idmap += batch_of_ids

            batch_of_features = np.stack(batch_of_features)
            faiss.normalize_L2(batch_of_features)
            index.add(batch_of_features)

        return index, idmap

    for video_features_file in args.video_features_files:
        index, idmap = _add_single_features_file(video_features_file, index, idmap)
    print('Index updated.')

    # save index to disk
    print('Saving index ...')
    faiss.write_index(index, str(args.index_file))

    # write updated idmap file
    with open(args.idmap_file, 'w') as idmap_file:
        idmap_file.write('\n'.join(idmap))
        idmap_file.write('\n')
    print('Index saved.')

def remove(args):
    pass
# def remove(args):  Hàm bị lỗi ids của file mapping
#     # Xóa index của frame thuộc video_id nhất định Ex: video_id = L21_V001 thì tất cả frame có id dạng L21_V001-xxxxx sẽ bị xóa khỏi index. 

#     # load index and idmap
#     index = faiss.read_index(str(args.index_file))
#     with open(args.idmap_file, 'r') as lines:
#         idmap = list(map(str.rstrip, lines))

#     positions = set()
#     for video_id in tqdm(args.video_ids, delay=3):
#         regexp = re.compile(re.escape(video_id) + r'-\d+')
#         positions.update([i for i, _id in enumerate(idmap) if regexp.match(_id)])

#     # skip index saving if no changes were made
#     if not positions:
#         logging.info('Nothing to remove.')
#         return

#     idmap = [x for i, x in enumerate(idmap) if i not in positions]
#     positions = np.fromiter(positions, int, len(positions))
#     index.remove_ids(positions)
#     logging.info(f"Removed: {' '.join(args.video_ids)}")

#     # save index to disk
#     logging.info('Saving index ...')

#     # write updated idmap file
#     with open(args.idmap_file, 'w') as idmap_file:
#         idmap_file.write('\n'.join(idmap))
#         idmap_file.write('\n')

#     faiss.write_index(index, str(args.index_file))

#     logging.info('Index saved.')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='FAISS Index Manager: Creates/Updates FAISS indices.')
    parser.add_argument('--config-file', default='./collection_dir/config.yaml', help='path to yaml configuration file')
    parser.add_argument('index_file', type=Path, help='path to the faiss index')
    parser.add_argument('idmap_file', type=Path, help='path to the id mapping file')
    parser.add_argument('--features_name', type=str)
    subparsers = parser.add_subparsers(help='command')

    create_parser = subparsers.add_parser('create', help='Creates a new FAISS index from scratch')
    create_parser.add_argument('--force', default=False, action='store_true', help='overwrite existing data')
    create_parser.add_argument('--batch-size', type=int, default=50_000, help='add batch size')
    create_parser.add_argument('--train-size', type=int, default=50_000, help='features to use for index training')
    create_parser.add_argument('features_dir', type=Path, help='path to analysis directory containing features h5df files')
    create_parser.set_defaults(func=create)

    add_parser = subparsers.add_parser('add', help='Adds features to an existing FAISS index.')
    add_parser.add_argument('--force', default=False, action='store_true', help='overwrite existing data')
    add_parser.add_argument('--batch-size', type=int, default=50_000, help='add batch size')
    add_parser.add_argument('video_features_files', nargs='+', type=Path, help='path(s) to h5df file(s) or dir(s) containing video features')
    add_parser.set_defaults(func=add)

    rm_parser = subparsers.add_parser('remove', help='Remove a video from an existing FAISS index.')
    rm_parser.add_argument('video_ids', nargs='+', help='ID(s) of video(s) to be removed')
    rm_parser.set_defaults(func=remove)

    args = parser.parse_args()
    args.func(args)

    # Cần tạo file hdf5 trước tại phần analysis, sau đó mới tạo index từ file hdf5 đó. 
    # xx python -m services.index.faiss_index_manager.build ./database/clip-openai/clip-openai.index ./database/clip-openai/idmap_clip-openai.txt create ./features/clip-openai


"""
Some examples

EX1:

import faiss
import open_clip
import numpy as np
import torch

index = faiss.read_index('./database/open_clip/open_clip.index')

print(index.ntotal)

with open('./database/open_clip/idmap_openclip.txt', 'r') as f:
    data = []
    for line in f.readlines():
        data.append(line.strip())   


model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k')

tokenizer = open_clip.get_tokenizer('ViT-B-32') 
text= tokenizer(['Many people are standing on a beach'])

with torch.no_grad():
    text_features = model.encode_text(text).cpu().numpy()
    print(text_features.shape)
    texxt_features = text_features / np.linalg.norm(text_features, axis=1, keepdims=True)

D, I = index.search(text_features, k=5)
print([data[i] for i in I[0]])











"""