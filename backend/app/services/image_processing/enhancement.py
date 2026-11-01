import numpy as np
import cv2
from typing import Dict, Any, Tuple

def histogram_equalization(img: np.ndarray) -> np.ndarray:
    """
    Global cumulative distribution equalization maximizing scene dynamic range.
    For color images, equalizes the luminance channel Y in YCrCb color space to preserve chromaticity.
    Formula: s_k = T(r_k) = (L - 1) * sum_{j=0}^k p_r(r_j)
    """
    if len(img.shape) == 2 or (len(img.shape) == 3 and img.shape[2] == 1):
        gray = img if len(img.shape) == 2 else img[:, :, 0]
        return cv2.equalizeHist(gray.astype(np.uint8))
    else:
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
        return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

def clahe(img: np.ndarray, clip_limit: float = 2.0, tile_grid_size: int = 8) -> np.ndarray:
    """
    Contrast-Limited Adaptive Histogram Equalization (CLAHE).
    Divides image into contextual tiles, computes local histograms with clipping threshold,
    and interpolates tile boundaries to prevent noise over-amplification in uniform terrain.
    """
    clip_limit = max(0.5, float(clip_limit))
    tile_grid_size = max(2, int(tile_grid_size))
    clahe_obj = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_grid_size, tile_grid_size))

    if len(img.shape) == 2 or (len(img.shape) == 3 and img.shape[2] == 1):
        gray = img if len(img.shape) == 2 else img[:, :, 0]
        return clahe_obj.apply(gray.astype(np.uint8))
    else:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        lab[:, :, 0] = clahe_obj.apply(lab[:, :, 0])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

def contrast_stretching(img: np.ndarray, p_low: float = 2.0, p_high: float = 98.0) -> np.ndarray:
    """
    Linear percentile contrast stretching (Normalization with 2%-98% outlier clipping).
    Formula: s = clip((r - v_min) * (255 / (v_max - v_min)), 0, 255)
    """
    p_low = max(0.0, min(float(p_low), 45.0))
    p_high = max(55.0, min(float(p_high), 100.0))

    if len(img.shape) == 2 or (len(img.shape) == 3 and img.shape[2] == 1):
        gray = img if len(img.shape) == 2 else img[:, :, 0]
        v_min, v_max = np.percentile(gray, (p_low, p_high))
        stretched = np.clip((gray.astype(np.float64) - v_min) * (255.0 / (v_max - v_min + 1e-6)), 0, 255)
        return stretched.astype(np.uint8)
    else:
        channels = cv2.split(img)
        stretched_ch = []
        for ch in channels:
            v_min, v_max = np.percentile(ch, (p_low, p_high))
            str_ch = np.clip((ch.astype(np.float64) - v_min) * (255.0 / (v_max - v_min + 1e-6)), 0, 255)
            stretched_ch.append(str_ch.astype(np.uint8))
        return cv2.merge(stretched_ch)

def gamma_correction(img: np.ndarray, gamma: float = 1.0) -> np.ndarray:
    """
    Power-Law (Gamma) transformation: s = c * r^gamma
    gamma < 1 expands dark shadow details (e.g. water/shadow areas),
    gamma > 1 compresses highlights (e.g. cloud/high-albedo urban).
    """
    gamma = max(0.1, min(float(gamma), 5.0))
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(np.uint8)
    return cv2.LUT(img, table)

def log_transform(img: np.ndarray, c: float = 1.0) -> np.ndarray:
    """
    Logarithmic dynamic range transformation: s = c * log(1 + r)
    Expands low gray levels and compresses high gray levels.
    """
    c = max(0.1, float(c))
    img_float = img.astype(np.float64)
    log_img = c * np.log(1.0 + img_float)
    # Normalize to 0-255
    max_val = np.max(log_img) + 1e-6
    normalized = (log_img / max_val) * 255.0
    return np.clip(normalized, 0, 255).astype(np.uint8)
