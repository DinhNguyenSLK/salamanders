import faiss

index= faiss.read_index('./collection_dir/faiss-index_openclip.faiss')
print(index.ntotal)

i1 = index.reconstruct(283)

D, I = index.search(i1.reshape(1, -1), k=5)
print(I[0])

