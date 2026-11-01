import os
import math
import numpy as np
import cv2
from typing import Dict, Any, Optional, Tuple, List
from app.core.config import settings

def load_image(image_path: str) -> np.ndarray:
    """
    Load image from filesystem in BGR uint8 format with strict validation.
    Handles virtual sample prefixes like 'sample:scene_2020_t1.png'.
    """
    resolved_path = image_path
    if image_path.startswith("sample:"):
        sample_name = image_path.replace("sample:", "")
        resolved_path = os.path.join(settings.SAMPLE_DATA_DIR, sample_name)
    elif not os.path.isabs(image_path):
        resolved_path = os.path.join(settings.SAMPLE_DATA_DIR, image_path)

    if not os.path.exists(resolved_path):
        # Try uploads directory as fallback
        alt_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(image_path))
        if os.path.exists(alt_path):
            resolved_path = alt_path
        else:
            raise FileNotFoundError(f"Image not found at path: {image_path} (resolved: {resolved_path})")

    img = cv2.imread(resolved_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Failed to decode image from path: {resolved_path}")

    # Convert 4-channel BGRA to BGR if necessary
    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    return img

def load_image_rgb(image_path: str) -> np.ndarray:
    """Load image converted to RGB representation."""
    bgr = load_image(image_path)
    if len(bgr.shape) == 2 or bgr.shape[2] == 1:
        return cv2.cvtColor(bgr, cv2.COLOR_GRAY2RGB)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

def load_image_gray(image_path: str) -> np.ndarray:
    """Load image converted to 8-bit Grayscale representation."""
    bgr = load_image(image_path)
    if len(bgr.shape) == 2:
        return bgr
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

def validate_image(img: np.ndarray) -> bool:
    """
    Validates that an array is a valid non-empty 2D or 3D image with uint8 depth.
    """
    if not isinstance(img, np.ndarray):
        return False
    if img.size == 0:
        return False
    if len(img.shape) not in [2, 3]:
        return False
    if len(img.shape) == 3 and img.shape[2] not in [1, 3, 4]:
        return False
    return True

def extract_metadata(img: np.ndarray, path: Optional[str] = None) -> Dict[str, Any]:
    """
    Extracts comprehensive image metadata: dimensions, aspect ratio, color model,
    bit depth, memory size, min/max intensity, mean, standard deviation, and Shannon entropy.
    """
    if len(img.shape) == 2:
        h, w = img.shape
        c = 1
        color_model = "Grayscale / Monochromatic"
        gray = img
    else:
        h, w, c = img.shape
        color_model = "3-Channel BGR / Multi-spectral" if c == 3 else f"{c}-Channel Matrix"
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if c >= 3 else img[:, :, 0]

    min_val = float(np.min(gray))
    max_val = float(np.max(gray))
    mean_val = float(np.mean(gray))
    std_val = float(np.std(gray))
    contrast_michelson = float((max_val - min_val) / (max_val + min_val + 1e-6))
    contrast_rms = float(np.sqrt(np.mean((gray.astype(np.float64) - mean_val) ** 2)))

    # Compute Shannon Entropy H = -sum(p * log2(p))
    hist, _ = np.histogram(gray, bins=256, range=(0, 256), density=True)
    hist = hist[hist > 0]
    entropy = float(-np.sum(hist * np.log2(hist))) if len(hist) > 0 else 0.0

    return {
        "width": w,
        "height": h,
        "channels": c,
        "aspect_ratio": f"{w}:{h}" if h > 0 else "1:1",
        "color_model": color_model,
        "bit_depth": img.dtype.name,
        "memory_footprint_kb": round(img.nbytes / 1024.0, 2),
        "min_intensity": round(min_val, 2),
        "max_intensity": round(max_val, 2),
        "mean_intensity": round(mean_val, 2),
        "std_deviation": round(std_val, 2),
        "michelson_contrast": round(contrast_michelson, 4),
        "rms_contrast": round(contrast_rms, 4),
        "shannon_entropy": round(entropy, 4),
        "source_path": path
    }

def simulate_sampling(img: np.ndarray, factor: int = 2) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Demonstrates spatial sampling resolution reduction by downsampling by factor N
    and nearest-neighbor / bilinear re-upscaling to illustrate pixelation / block artifacts.
    """
    if factor < 1:
        factor = 1
    h, w = img.shape[:2]
    new_w = max(1, w // factor)
    new_h = max(1, h // factor)

    downsampled = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_NEAREST)
    sampled_reconstructed = cv2.resize(downsampled, (w, h), interpolation=cv2.INTER_NEAREST)

    metrics = {
        "original_resolution": f"{w}x{h}",
        "sampled_grid": f"{new_w}x{new_h}",
        "sampling_factor": factor,
        "nyquist_frequency_reduction": f"1/{factor}x",
        "reconstruction_method": "Nearest-Neighbor Reconstruction"
    }
    return sampled_reconstructed, metrics

def simulate_quantization(img: np.ndarray, levels: int = 8) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Demonstrates intensity quantization reduction (e.g. 2, 4, 8, 16, 32, 64, 128 levels)
    illustrating false contouring and reduced dynamic depth.
    Formula: q(r) = floor(r / (256 / L)) * (256 / (L - 1))
    """
    if levels < 2:
        levels = 2
    if levels > 256:
        levels = 256

    step = 256.0 / levels
    quantized_float = np.floor(img.astype(np.float64) / step) * (255.0 / (levels - 1))
    quantized = np.clip(quantized_float, 0, 255).astype(np.uint8)

    bits_per_pixel = round(math.log2(levels), 2)
    metrics = {
        "quantization_levels": levels,
        "effective_bit_depth": f"{bits_per_pixel} bits / pixel",
        "intensity_step_size": round(step, 2),
        "phenomenon_demonstrated": "False Contouring (Mach Bands) at low L"
    }
    return quantized, metrics

def convert_color_spaces(img: np.ndarray) -> Dict[str, np.ndarray]:
    """
    Converts input BGR image to RGB, HSV, LAB, and YCrCb/YCbCr color representations.
    Returns visualizable uint8 BGR/RGB representations of each color space.
    """
    if len(img.shape) == 2 or img.shape[2] == 1:
        gray = img if len(img.shape) == 2 else img[:, :, 0]
        bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    else:
        bgr = img

    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)

    return {
        "bgr": bgr,
        "rgb": rgb,
        "hsv": hsv,
        "lab": lab,
        "ycrcb": ycrcb
    }
