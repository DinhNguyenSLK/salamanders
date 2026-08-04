import csv
from pathlib import Path
import itertools
import re
import warnings
from tqdm import tqdm
import more_itertools

from .saver import HDF5File, GzipJsonlFile

class BaseExtractor:
    """ Base class for all extractors.  """

    @classmethod
    def add_arguments(cls, parser):
        """ Add arguments to the parser.  """
        
        parser.add_argument('--chunk-size', type=int, default=-1,  help='if the extractor does not support streaming extraction, send this many image paths to the extractor at once. -1 means send all at once.')
        parser.add_argument('--force', default=False, action='store_true', help='force extraction even if the output file already exists.')
        parser.add_argument('--gpu', default=False, action='store_true', help='use gpu for extraction if supported by the extractor.')
        parser.add_argument('--save-every', type=int, default=5000, help='flush every N records extracted')

        parser.add_argument('input_images', type=Path, help='images to be processed.'
            'Can be a directory or a file with a list of images.'
            'Each line of the list must be in the format: [[<video_id>\\t]<image_id>\\t]<image_path>\n'
            'If <video_id> is specified, contiguos images with the same <video_id> will be grouped together in the output files.'
            'If <image_id> is not specified, an incremental number will be used instead.')
        
        subparser = parser.add_subparsers(dest='output_type')

        file_parser = subparser.add_parser('jsonl', help='save results to gzipped JSONL files')
        file_parser.add_argument('-n', '--features-name', default='generic', help='identifier of feature type', required=True)
        file_parser.add_argument('-o', '--output', type=Path,default='./features/{feature_name}/{video_id}/{video_id}.jsonl.gz', help='output path template, where "{video_id}" will be replaced by the video id.')


        hdf5_parser = subparser.add_parser('hdf5', help='save output to hdf5 files')
        hdf5_parser.add_argument('-n', '--features-name', default='generic', help='identifier of feature type', required=True)
        hdf5_parser.add_argument('-o', '--output', type=str, default='./features/{feature_name}/{video_id}/{video_id}.hdf5', help='output path template, where "{video_id}" will be replaced by the video id.')
        # Ex: python extractor.py --chunk-size 1000 --save-every 1000 --gpu input_images.txt hdf5 -n <feature-name> -o <output/{video_id}_features.hdf5>

    def __init__(self, args):
        self.args =args
    
    def parse_input(self):
        """Parses the input file and returns a list of (video_id, frame_id, frame_path) tuples."""
        input_path = self.args.input_images

        # Xử lý cho mỗi video  (Chủ yếu dùng cái này)
        if input_path.is_dir():
            image_list = sorted(input_path.glob('*.jpg')) or sorted(input_path.glob('*.png'))
            ids_and_paths = [(input_path.name, p.stem, p) for p in image_list]
        else:
            # input is .tsv file 
            with input_path.open() as image_list:
                reader = csv.reader(image_list, delimiter='\t')

                rows = list(reader)
                
                ids_and_paths = []
                if len(rows) > 0:
                    num_cols = len(rows[0])

                    for row in rows:
                        if num_cols == 2:
                            frame_id = row[0]
                            frame_path = Path(row[1])
                            ids_and_paths.append(('', frame_id, frame_path))

                        elif num_cols == 3:
                            video_id = row[0]
                            frame_id = row[1]
                            frame_path = Path(row[2])
                            ids_and_paths.append((video_id, frame_id, frame_path))       
                        else:
                            raise ValueError("File phải có 2 hoặc 3 cột")
                        
        return ids_and_paths
    
    def get_saver(self, video_id):
        """ Returns a saver for the given video id.
        structure of output:
    features/
        ├── clip/
        │   ├── video1/
        │   │   └── features.hdf5
        │   ├── video2/
        │   │   └── features.hdf5
        │
        ├── dinov2/
        │   ├── video1/
        │   │   └── features.hdf5
        │   ├── video2/
        │   │   └── features.hdf5 
          
            """
        output_path = str(self.args.output).format(video_id=video_id, feature_name=self.args.features_name)
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        save_every = self.args.save_every

        if self.args.output_type == 'hdf5':
            return HDF5File(output_path, flush_every=save_every, attrs={'features_name': self.args.features_name}) 
        elif self.args.output_type == 'jsonl':
            return GzipJsonlFile(output_path, flush_every=save_every)

    def extract(self, image_paths):
        """ Loads a batch of images and extracts features. """
        raise NotImplementedError()
    

    def extract_iterable(self, image_paths):
        """ Consumes an iterable and returns an iterable of records.
            This method contains a fallback implementation using chunked processing,
            but subclasses can implement optimized solutions here.
        """
        if self.args.chunk_size > 0:
            batched_image_paths = more_itertools.chunked(image_paths, self.args.chunk_size)
        else:
            warnings.warn(
                'Using chunked processing with chunk_size=-1. '
                'This may cause memory issues and progress not showing correctly. '
                'Set a positive chunk_size or implement extract_iterable() in your extractor to avoid this.'
            )
            batched_image_paths = [list(image_paths)]
        batched_records = map(self.extract, batched_image_paths)
        records = itertools.chain.from_iterable(batched_records)   # flatten [ [..], [...] ] -> [ .. ]
        return records

    def skip_existing(self, ids_and_paths, progress=None):
        """ Skips images that have already been processed. """
        
        pbar = tqdm(total=len(ids_and_paths), desc="Skipping processed images") if progress else None

        # Mỗi video có output riêng
        for video_id, group in itertools.groupby(ids_and_paths, key=lambda x: x[0]):
            with self.get_saver(video_id) as saver:
                to_be_processed = []
                for video_id, image_id, image_path in group:
                    if image_id not in saver:
                        to_be_processed.append((video_id, image_id, image_path))
                    elif pbar:
                        pbar.update(1)
            # ensure saver is closed before yielding from group
            if pbar:
                pbar.close()
            yield from to_be_processed
    
    def run(self):
        ids_and_paths = self.parse_input()
        ids_and_paths = sorted(ids_and_paths, key=lambda x: x[0])

        n_images = len(ids_and_paths)

        progress = True

        if not self.args.force:
            ids_and_paths = self.skip_existing(ids_and_paths, progress)  # có thể bổ sung thêm image sau khi lưu file hdf5

        # unzip ids and paths
        ids_and_paths = more_itertools.unzip(ids_and_paths)  # [(V_i...),  (frid....), (frPath....)]
        ids_and_paths = more_itertools.padded(ids_and_paths, fillvalue=(), n=3)  # pad with empty values on empty iterable
        video_ids, image_ids, image_paths = ids_and_paths

        # process images in batches
        records = self.extract_iterable(image_paths)
        ids_and_records = zip(video_ids, image_ids, records)
        ids_and_records = tqdm(ids_and_records, total=n_images)
        
        # group images by video id
        for video_id, group in itertools.groupby(ids_and_records, key=lambda x: x[0]):
            records = [{'_id': _id, **record} for _, _id, record in group]
            with self.get_saver(video_id) as saver:
                saver.add_many(records, force=self.args.force)
    

                    

