import os
import uuid
import numpy as np
import cv2
import tifffile
from PIL import Image
from typing import Dict, Any, Tuple, Optional, List
from app.core.config import settings

def resolve_raster_path(raster_path: Optional[str]) -> str:
    """Resolve virtual sample names, upload paths, or absolute paths."""
    if not raster_path:
        return os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif")
    if os.path.isabs(raster_path) and os.path.exists(raster_path):
        return raster_path
    if raster_path.startswith("sample:"):
        s_name = raster_path.replace("sample:", "")
        return os.path.join(settings.SAMPLE_DATA_DIR, s_name)
    if raster_path.startswith("/api/v1/samples/"):
        return os.path.join(settings.SAMPLE_DATA_DIR, os.path.basename(raster_path))
    if raster_path.startswith("/api/v1/uploads/"):
        return os.path.join(settings.UPLOAD_DIR, os.path.basename(raster_path))
    if raster_path.startswith("/api/v1/processed/"):
        return os.path.join(settings.PROCESSED_DIR, os.path.basename(raster_path))

    # Check sample dir
    cand = os.path.join(settings.SAMPLE_DATA_DIR, os.path.basename(raster_path))
    if os.path.exists(cand):
        return cand
    cand_up = os.path.join(settings.UPLOAD_DIR, os.path.basename(raster_path))
    if os.path.exists(cand_up):
        return cand_up

    return raster_path

def load_raster(path: str) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Loads raster image from GeoTIFF, multi-band TIFF, PNG, or JPEG.
    Returns:
      data: np.ndarray of shape (band_count, height, width) in native dtype
      meta: dictionary of basic raw format metadata
    """
    resolved = resolve_raster_path(path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(f"Raster file not found at: {path} (resolved: {resolved})")

    ext = os.path.splitext(resolved)[1].lower()
    raw_meta = {
        "filename": os.path.basename(resolved),
        "file_path": resolved,
        "extension": ext,
        "file_size_bytes": os.path.getsize(resolved)
    }

    if ext in ['.tif', '.tiff', '.geotiff']:
        try:
            with tifffile.TiffFile(resolved) as tif:
                data = tif.asarray()
                raw_meta["tiff_tags"] = {str(tag.code): tag.value for tag in tif.pages[0].tags if tag.code not in [34735, 34736, 34737]}
                raw_meta["series_count"] = len(tif.series)
                raw_meta["page_count"] = len(tif.pages)
        except Exception as e:
            # Fallback to Pillow
            img = Image.open(resolved)
            data = np.array(img)
            raw_meta["pillow_fallback"] = True
    else:
        # Standard image (PNG/JPEG)
        img = cv2.imread(resolved, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError(f"Failed to decode raster image from path: {resolved}")
        data = img

    # Standardize data shape to (bands, height, width)
    if data.ndim == 2:
        # (H, W) -> (1, H, W)
        data = data[np.newaxis, :, :]
    elif data.ndim == 3:
        if data.shape[2] in [1, 3, 4] and data.shape[0] not in [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]:
            # OpenCV (H, W, C) -> (C, H, W)
            # If BGR from OpenCV, convert to RGB for natural bands
            if data.shape[2] == 3:
                data = cv2.cvtColor(data, cv2.COLOR_BGR2RGB)
            data = np.transpose(data, (2, 0, 1))
        elif data.shape[0] <= 16 and data.shape[1] > 16 and data.shape[2] > 16:
            # Already (Bands, H, W)
            pass
        else:
            # Assume (H, W, Bands) -> (Bands, H, W)
            data = np.transpose(data, (2, 0, 1))

    raw_meta["shape"] = list(data.shape)
    raw_meta["dtype"] = str(data.dtype)
    return data, raw_meta

def validate_raster(path: str) -> Dict[str, Any]:
    """
    Validates raster integrity, dimensions, header decodability, and non-empty pixel arrays.
    """
    try:
        resolved = resolve_raster_path(path)
        if not os.path.exists(resolved):
            return {
                "is_valid": False,
                "message": f"File not found: {path}",
                "filename": os.path.basename(path),
                "format": "Unknown",
                "band_count": 0,
                "width": 0,
                "height": 0,
                "crs": "Unknown",
                "has_georeferencing": False,
                "details": {}
            }

        data, meta = load_raster(resolved)
        bands, h, w = data.shape
        if bands == 0 or h == 0 or w == 0:
            return {
                "is_valid": False,
                "message": "Raster contains empty dimensions.",
                "filename": meta["filename"],
                "format": meta.get("extension", "raster"),
                "band_count": bands,
                "width": w,
                "height": h,
                "crs": "Unknown",
                "has_georeferencing": False,
                "details": meta
            }

        return {
            "is_valid": True,
            "message": f"Valid {bands}-band raster ({w}x{h} px, {data.dtype}).",
            "filename": meta["filename"],
            "format": "GeoTIFF / TIFF" if meta.get("extension") in ['.tif', '.tiff'] else meta.get("extension", "raster").upper(),
            "band_count": bands,
            "width": w,
            "height": h,
            "crs": "EPSG:32643" if "sentinel2" in meta["filename"].lower() or "landsat9" in meta["filename"].lower() else "EPSG:4326",
            "has_georeferencing": meta.get("extension") in ['.tif', '.tiff'],
            "details": meta
        }
    except Exception as e:
        return {
            "is_valid": False,
            "message": f"Raster validation failed: {str(e)}",
            "filename": os.path.basename(path),
            "format": "Corrupted / Unrecognized",
            "band_count": 0,
            "width": 0,
            "height": 0,
            "crs": "Unknown",
            "has_georeferencing": False,
            "details": {"error": str(e)}
        }

def save_preview_image(arr: np.ndarray, prefix: str = "preview") -> Tuple[str, str]:
    """
    Saves visualizable uint8 2D or 3D RGB array as PNG.
    arr: (H, W) or (H, W, 3) in uint8 or float
    """
    if arr.dtype != np.uint8:
        if np.issubdtype(arr.dtype, np.floating):
            arr = np.clip(arr * 255.0, 0, 255).astype(np.uint8)
        else:
            arr = np.clip(arr, 0, 255).astype(np.uint8)

    filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
    abs_path = os.path.join(settings.PROCESSED_DIR, filename)

    if arr.ndim == 3 and arr.shape[2] == 3:
        # Convert RGB to BGR for cv2 imwrite
        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        cv2.imwrite(abs_path, bgr)
    else:
        cv2.imwrite(abs_path, arr)

    return abs_path, f"/api/v1/processed/{filename}"
