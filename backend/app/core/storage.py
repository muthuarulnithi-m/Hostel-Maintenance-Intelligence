from pathlib import Path
import uuid

from fastapi import UploadFile


UPLOAD_DIR = Path("uploads/complaints")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


MAX_FILE_SIZE = 5 * 1024 * 1024


async def save_complaint_image(
    file: UploadFile,
):

    if file.content_type not in ALLOWED_CONTENT_TYPES:

        raise ValueError(
            "Only JPG, PNG and WEBP images are allowed"
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:

        raise ValueError(
            "Image size must be 5 MB or less"
        )

    extension = (
        Path(file.filename or "")
        .suffix
        .lower()
    )

    if not extension:

        extension = ".jpg"

    unique_name = (
        f"{uuid.uuid4().hex}{extension}"
    )

    file_path = UPLOAD_DIR / unique_name

    file_path.write_bytes(content)

    return {
        "file_name": file.filename or unique_name,
        "file_path": str(file_path),
        "content_type": file.content_type,
    }