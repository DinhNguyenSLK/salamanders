from rank_bm25 import BM25Okapi

# Tập văn bản (docs)
docs = [
    "Học máy là một nhánh của trí tuệ nhân tạo",
    "BM25 là thuật toán xếp hạng trong Information Retrieval",
    "CLIP dùng để ánh xạ hình ảnh và văn bản bM25 "
]

# Tokenize (đơn giản bằng split)
tokenized_docs = [doc.lower().split(" ") for doc in docs]

# Khởi tạo BM25
bm25 = BM25Okapi(tokenized_docs)

# Query
query = "thuật toán BM25 trong IR"
tokenized_query = query.lower().split(" ")

# Tính điểm
scores = bm25.get_scores(tokenized_query)

# Xếp hạng kết quả
for doc, score in sorted(zip(docs, scores), key=lambda x: x[1], reverse=True):
    print(score, doc)
