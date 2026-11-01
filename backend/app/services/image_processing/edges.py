import numpy as np
import cv2
from typing import Dict, Any

def _to_gray(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 2:
        return img
    if len(img.shape) == 3 and img.shape[2] == 1:
        return img[:, :, 0]
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

def sobel_edge(img: np.ndarray, kernel_size: int = 3, direction: str = 'both') -> np.ndarray:
    """
    1st-order Sobel gradient approximation:
    G_x = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
    G_y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
    Magnitude: |G| = sqrt(G_x^2 + G_y^2)
    """
    gray = _to_gray(img)
    k = max(1, min(int(kernel_size), 7))
    if k % 2 == 0:
        k += 1

    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=k)
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=k)

    dir_lower = direction.lower()
    if dir_lower in ['x', 'horizontal']:
        mag = np.abs(gx)
    elif dir_lower in ['y', 'vertical']:
        mag = np.abs(gy)
    else:
        mag = np.sqrt(gx ** 2 + gy ** 2)

    # Normalize to 0-255
    max_val = np.max(mag) + 1e-6
    edge_map = np.clip((mag / max_val) * 255.0, 0, 255).astype(np.uint8)
    return edge_map

def prewitt_edge(img: np.ndarray) -> np.ndarray:
    """
    Prewitt unweighted gradient difference operator:
    G_x = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]]
    G_y = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]]
    """
    gray = _to_gray(img)
    kernel_x = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], dtype=np.float32)
    kernel_y = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], dtype=np.float32)

    gx = cv2.filter2D(gray.astype(np.float32), -1, kernel_x)
    gy = cv2.filter2D(gray.astype(np.float32), -1, kernel_y)
    mag = np.sqrt(gx ** 2 + gy ** 2)

    max_val = np.max(mag) + 1e-6
    edge_map = np.clip((mag / max_val) * 255.0, 0, 255).astype(np.uint8)
    return edge_map

def roberts_edge(img: np.ndarray) -> np.ndarray:
    """
    Roberts Cross 2x2 diagonal difference operator:
    G_x = [[1, 0], [0, -1]]
    G_y = [[0, 1], [-1, 0]]
    """
    gray = _to_gray(img)
    kernel_x = np.array([[1, 0], [0, -1]], dtype=np.float32)
    kernel_y = np.array([[0, 1], [-1, 0]], dtype=np.float32)

    gx = cv2.filter2D(gray.astype(np.float32), -1, kernel_x)
    gy = cv2.filter2D(gray.astype(np.float32), -1, kernel_y)
    mag = np.sqrt(gx ** 2 + gy ** 2)

    max_val = np.max(mag) + 1e-6
    edge_map = np.clip((mag / max_val) * 255.0, 0, 255).astype(np.uint8)
    return edge_map

def canny_edge(img: np.ndarray, threshold1: float = 50, threshold2: float = 150, aperture_size: int = 3) -> np.ndarray:
    """
    Optimal Canny multi-stage edge detection pipeline:
    1. Gaussian smoothing to suppress noise.
    2. Gradient magnitude & direction calculation.
    3. Non-maximum suppression along gradient direction.
    4. Dual-threshold hysteresis for connected edge tracking.
    """
    gray = _to_gray(img)
    t1 = max(1.0, float(threshold1))
    t2 = max(t1, float(threshold2))
    ap = max(3, min(int(aperture_size), 7))
    if ap % 2 == 0:
        ap += 1

    edges = cv2.Canny(gray, threshold1=t1, threshold2=t2, apertureSize=ap, L2gradient=True)
    return edges
