"""
File handling utilities for uploaded audio and video files
"""

import os
import uuid
from werkzeug.utils import secure_filename
from typing import Tuple

UPLOAD_FOLDER = '/tmp/baby_monitor_uploads'
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'ogg', 'webm', 'm4a'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'avi', 'mov'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def init_upload_folder():
    """Create upload folder if it doesn't exist."""
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename: str, file_type: str) -> bool:
    """Check if file extension is allowed."""
    if '.' not in filename:
        return False

    ext = filename.rsplit('.', 1)[1].lower()

    if file_type == 'audio':
        return ext in ALLOWED_AUDIO_EXTENSIONS
    elif file_type == 'video':
        return ext in ALLOWED_VIDEO_EXTENSIONS

    return False

def save_uploaded_file(file, file_type: str) -> Tuple[str, str]:
    """
    Save uploaded file with unique name.

    Args:
        file: FileStorage object from Flask
        file_type: 'audio' or 'video'

    Returns:
        Tuple of (file_path, error_message)
    """
    if not file or file.filename == '':
        return None, "No file provided"

    if not allowed_file(file.filename, file_type):
        return None, f"Invalid {file_type} file type"

    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{file_type}_{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    try:
        file.save(file_path)

        # Check file size
        if os.path.getsize(file_path) > MAX_FILE_SIZE:
            os.remove(file_path)
            return None, f"File too large (max {MAX_FILE_SIZE // 1024 // 1024}MB)"

        return file_path, None

    except Exception as e:
        return None, f"Error saving file: {str(e)}"

def cleanup_file(file_path: str):
    """Remove temporary file."""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error cleaning up file {file_path}: {e}")
