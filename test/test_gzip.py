import gzip
import json
from pprint import pprint
def read_file(file_path):
    with gzip.open(file_path, 'rt') as f:
        text = f.read()
        print(text)

def write_jsonfile(data, file_path):
    with gzip.open(file_path+'.gz', 'wt') as f:
        json.dump(data, f)

def load_jsonfile(file_path):
    with gzip.open(file_path, 'rt') as f:
        data = json.load(f)
        return data
if __name__ == "__main__":
    data = {
    "name": "Alice",
    "age": 20
}
    # c = 0
    # with gzip.open('./encoded_str/object_detection/L21_V001.jsonl.gz', 'rt') as f:
    #     datas = [json.loads(line) for line in f]  # mỗi dòng là một JSON object
    #     pprint(datas[-1])
            # objs = json.loads(line)
            # print(type(objs))
            # print(objs['_id'])
    
    with gzip.open('./collection_dir\\objects-yolov8x-oiv7\\L21_V001\\L21_V001-objects-yolov8x-oiv7.jsonl.gzip', 'rt') as f:
        datas = [json.loads(line) for line in f]
        pprint(datas[285])
            
           