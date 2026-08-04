import kagglehub

handle = 'nhnguynvn1902/video_L26'
local_dataset_dir = './collection_dir/videos/L26'

# Create a new dataset
kagglehub.dataset_upload(handle, local_dataset_dir)
