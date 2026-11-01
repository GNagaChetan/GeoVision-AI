import numpy as np
import cv2
from typing import Dict, Any, Tuple

def _to_gray(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 2:
        return img
    if len(img.shape) == 3 and img.shape[2] == 1:
        return img[:, :, 0]
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

def global_threshold(img: np.ndarray, thresh: float = 127, max_val: float = 255, method: str = 'binary') -> np.ndarray:
    """
    Fixed-level global thresholding:
    Binary: g(x, y) = max_val if f(x, y) > T else 0
    Binary Inverted: g(x, y) = 0 if f(x, y) > T else max_val
    """
    gray = _to_gray(img)
    t = float(thresh)
    mv = float(max_val)

    type_map = {
        'binary': cv2.THRESH_BINARY,
        'binary_inv': cv2.THRESH_BINARY_INV,
        'trunc': cv2.THRESH_TRUNC,
        'tozero': cv2.THRESH_TOZERO,
        'tozero_inv': cv2.THRESH_TOZERO_INV
    }
    th_type = type_map.get(method.lower(), cv2.THRESH_BINARY)
    _, binary = cv2.threshold(gray, t, mv, th_type)
    return binary

def otsu_threshold(img: np.ndarray) -> Tuple[float, np.ndarray]:
    """
    Otsu's global optimal thresholding maximizing inter-class variance between object and background.
    sigma_B^2(k) = (m_G * P_1(k) - m(k))^2 / (P_1(k) * (1 - P_1(k)))
    """
    gray = _to_gray(img)
    otsu_val, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return float(otsu_val), binary

def adaptive_threshold(img: np.ndarray, block_size: int = 11, c_val: float = 2.0, method: str = 'gaussian') -> np.ndarray:
    """
    Adaptive thresholding calculating local threshold T(x, y) over block_size x block_size neighborhood.
    Resilient to non-uniform terrain illumination and cloud shadows.
    """
    gray = _to_gray(img)
    bs = max(3, int(block_size))
    if bs % 2 == 0:
        bs += 1
    c = float(c_val)

    adaptive_method = cv2.ADAPTIVE_THRESH_GAUSSIAN_C if method.lower() == 'gaussian' else cv2.ADAPTIVE_THRESH_MEAN_C
    binary = cv2.adaptiveThreshold(gray, 255, adaptive_method, cv2.THRESH_BINARY, bs, c)
    return binary
