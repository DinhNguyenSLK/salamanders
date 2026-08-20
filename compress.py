from PIL import Image
from pathlib import Path


def compress_image(
    input_path: str | Path,
    output_path: str | Path,
    quality: int = 30
):
    """
    Resize ảnh 1280x720 -> 480x270 và nén JPEG tối ưu.

    Args:
        input_path: Đường dẫn ảnh gốc.
        output_path: Đường dẫn ảnh output.
        quality: JPEG quality (30-50 thường phù hợp).
    """

    input_path = Path(input_path)
    output_path = Path(output_path)

    with Image.open(input_path) as img:
        # Đảm bảo JPEG không gặp vấn đề với RGBA/P mode
        img = img.convert("RGB")

        # Resize 1280x720 -> 480x270
        img = img.resize(
            (640, 360),
            Image.Resampling.LANCZOS
        )

        # Tạo thư mục output nếu chưa tồn tại
        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        # JPEG compression
        img.save(
            output_path,
            format="JPEG",
            quality=quality,
            optimize=True,
            progressive=True
        )

if __name__ == "__main__":
    compress_image(
        "./collection_dir/selected-frames/L26_V427/L26_V427-05374.jpg",
        "./out.jpg"
    )