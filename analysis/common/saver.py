
import h5py
from abc import ABC, abstractmethod
from pathlib import Path
import zlib
import gzip
import json

class Saver(ABC):
    @abstractmethod
    def add(self, record):
        pass
    def add_many(self, records, force=False):
        for record in records:
            self.add(record, force=force)


class HDF5File(Saver):
    # Save/load/append to hdf5 file
    """
    <file_name>.hdf5
    ├── ids: 1d vector of string ids
    ├── data: 2d vector of feature vectors
    └── attrs: attributes of the file (e.g. feature type, extractor version
    
    
    """
    def __init__(self, file_path, read_only=False, flush_every=100, attrs={}):
    
        self.path = Path(file_path)
        self.read_only = read_only
        self.flush_every = flush_every
        self.attrs = attrs

        self.file = None
        self._ids = dict()
        self._to_be_flushed = 0

        self._ids_dataset = None
        self._data_dataset = None

    def __enter__(self):
        # Run when entering context manager
        if self.read_only and not self.path.exists():
            return self # return empty saver  
        
        mode = 'r' if self.read_only else 'a'

        self.file = h5py.File(self.path, mode)

        if 'ids' in self.file:
            self._ids_dataset = self.file['ids']
            self._data_dataset = self.file['data']
            self._ids = {_id: i for i, _id in enumerate(self._ids_dataset.asstr()[:])}   # format: {_id: index} Ex: {'L21_V01-00069': 0, 'L21_V001-00070': 1, ...}
        
        if not self.read_only:
            for k, v in self.attrs.items():
                self.file.attrs[k] = v

        return self

    def __exit__(self, exc_type, exc_value, traceback):
        # Run when exiting context manager
        if self.file is not None:
            self.file.close()
    
    def __contains__(self, _id):
        return _id in self._ids
    
    def add(self, record, force=False):
        """
        record: dict with keys 'id' and 'feature_vector'
        force: if True, overwrite existing record with same id
        """
        assert not self.read_only, "Cannot add record to read-only HDF5 file."

        feature_vector = record['feature_vector']
        dim = len(feature_vector)

        if self._ids_dataset is None:
            self._ids_dataset = self.file.create_dataset('ids',                     # 1d vector of string ids
                                                        shape=(0,),
                                                          maxshape=(None,), 
                                                          dtype=h5py.special_dtype(vlen=str))
            
            self._data_dataset = self.file.create_dataset('data',                   # 2d vector of feature vectors
                                                        shape=(0, dim),
                                                        maxshape=(None, dim),
                                                        dtype='float32')
            
        _id = record['_id']   # frame_id vd L21_V001-0004

        if _id in self._ids:   # Nếu _id đã tồn tại
            if not force:
                return
            index = self._ids[_id]
            
        else:
            index = len(self._ids)
            self._ids_dataset.resize((index + 1,))
            self._data_dataset.resize((index+1, dim))
            self._ids[_id] = index

        
        self._ids_dataset[index] = _id
        self._data_dataset[index, :] = feature_vector

        self._to_be_flushed += 1
        if self._to_be_flushed >= self.flush_every:
            self.file.flush()
            self._to_be_flushed = 0

class GzipJsonlFile(Saver):
    """ Save / Load / Append results in a GZipped JSONL file. """
    def __init__(self, path, flush_every=100):
        self.path = Path(path)
        self._ids = set()
        self._flush_every = flush_every
        self._to_be_flushed = 0

        if self.path.exists():
            try:
                with gzip.open(str(self.path), 'r') as f:
                    self._ids = {json.loads(line)['_id'] for line in f.read().splitlines()}
                
            except (EOFError, zlib.error) as e:
                
                self.path.unlink()

    def __enter__(self):
        self.file = gzip.open(str(self.path), 'at')
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.file.close()

    def __contains__(self, _id):
        return _id in self._ids

    def add(self, record, force=False):
        _id = record['_id']

        assert not (force and _id in self), f"Cannot force add existing record '{_id}' in jsonl.gz file."

        if _id not in self:
            self._ids.add(_id)
            self.file.write(json.dumps(record) + '\n')

            self._to_be_flushed += 1
            if self._to_be_flushed == self._flush_every:
                self.flush()
                self._to_be_flushed = 0

    def flush(self):
        self.file.flush()


if __name__ == "__main__":
    # python -m services.common.saver
    # Example usage
    with HDF5File('test.hdf5', flush_every=2) as saver:
        print(len(saver._ids))
        
        records = [
            {'_id': 'record1', 'feature_vector': [0.1, 0.2, 0.3]},
            {'_id': 'record2', 'feature_vector': [0.4, 0.5, 0.6]},
            {'_id': 'record3', 'feature_vector': [0.7, 0.8, 0.9]},
            {'_id': 'record3', 'feature_vector': [0.7, 0.8, 0.9]},   # duplicate id, should be ignored
        
        ]

        saver.add_many(records)
        print(len(saver._ids))
        print(saver._data_dataset[:])

        
        
        
























