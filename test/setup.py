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
text= tokenizer(['Many people are wearing white shirts and sitting on white chairs'])

with torch.no_grad():
    text_features = model.encode_text(text).cpu().numpy()
    print(text_features.shape)
    texxt_features = text_features / np.linalg.norm(text_features, axis=1, keepdims=True)

D, I = index.search(text_features, k=5)
print([data[i] for i in I[0]])


