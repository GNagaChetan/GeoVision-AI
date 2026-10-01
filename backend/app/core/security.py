import os
import re
from typing import Set
from fastapi import HTTPException, UploadFile, status

ALLOWED_IMAGE_EXTENSIONS: Set[str] = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS: Set[str] = {".pdf", ".txt", ".md", ".json", ".geojson"}
MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and unsafe characters."""
    base_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', base_name)
    return clean_name

def validate_image_upload(file: UploadFile) -> str:
    """Validate uploaded image file type and name."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        )
    return sanitize_filename(file.filename)

def validate_document_upload(file: UploadFile) -> str:
    """Validate uploaded document file type for RAG knowledge ingestion."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded document must have a valid filename."
        )
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))}"
        )
    return sanitize_filename(file.filename)

def validate_geojson_structure(data: dict) -> bool:
    """Validate basic GeoJSON structure (FeatureCollection or Feature or Geometry)."""
    if not isinstance(data, dict):
        return False
    geom_type = data.get("type")
    if not geom_type:
        return False
    if geom_type == "FeatureCollection":
        return isinstance(data.get("features"), list)
    elif geom_type == "Feature":
        return isinstance(data.get("geometry"), dict)
    elif geom_type in {"Polygon", "MultiPolygon", "Point", "MultiPoint", "LineString", "MultiLineString"}:
        return "coordinates" in data
    return False
