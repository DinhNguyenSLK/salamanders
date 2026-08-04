import h5py

# Mở file HDF5
with h5py.File("features\\clip-openai\\L21_V001\\L21_V001.hdf5", "r") as f:
    # Liệt kê các nhóm/dataset trong file
    print("Keys:", list(f.keys()))

    # Truy cập một dataset cụ thể
    dataset = f["ids"]
    data = dataset[:]   # đọc toàn bộ dữ liệu vào numpy array

    print("Shape:", data.shape)
    print("Data:", data)
