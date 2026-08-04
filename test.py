from pathlib import Path

keyframes_dir = Path("./collection_dir/keyframes-info")
total = 0
for file_path in keyframes_dir.glob("*/*-keyframes.txt"):
    all_keyframes = []
    with open(file_path, 'r') as f:
        lines = f.readlines()
        for line in lines:
            keyframes = line.strip().split()[1:]
            total += len(keyframes)
print(f"Total keyframes in {keyframes_dir.stem}: {total}")
            