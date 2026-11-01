import numpy as np
import cv2
from typing import Dict, Any

def mean_filter(img: np.ndarray, kernel_size: int = 5) -> np.ndarray:
    """
    Linear low-pass spatial smoothing box filter for uniform noise suppression.
    Kernel: h(x, y) = 1 / (N * N)
    """
    k = max(3, int(kernel_size))
    if k % 2 == 0:
        k += 1
    return cv2.blur(img, (k, k))

def median_filter(img: np.ndarray, kernel_size: int = 5) -> np.ndarray:
    """
    Non-linear order-statistic spatial filter for impulse / salt-and-pepper noise and SAR speckle removal
    while preserving sharp edge boundaries.
    """
    k = max(3, int(kernel_size))
    if k % 2 == 0:
        k += 1
    return cv2.medianBlur(img, k)

def gaussian_filter(img: np.ndarray, kernel_size: int = 5, sigma: float = 1.5) -> np.ndarray:
    """
    2D isotropic Gaussian convolution filter:
    G(x, y) = (1 / (2 * pi * sigma^2)) * exp(-(x^2 + y^2) / (2 * sigma^2))
    """
    k = max(3, int(kernel_size))
    if k % 2 == 0:
        k += 1
    sig = max(0.1, float(sigma))
    return cv2.GaussianBlur(img, (k, k), sig)

def sharpen(img: np.ndarray, strength: float = 1.2, method: str = 'laplacian') -> np.ndarray:
    """
    High-frequency detail sharpening via Laplacian or Unsharp Masking.
    Unsharp Masking: g(x, y) = f(x, y) + k * (f(x, y) - f_blur(x, y))
    """
    strength = max(0.1, min(float(strength), 5.0))
    if method.lower() == 'unsharp':
        blurred = cv2.GaussianBlur(img, (5, 5), 1.5)
        mask = cv2.subtract(img, blurred)
        sharpened = cv2.addWeighted(img, 1.0, mask, strength, 0)
        return sharpened
    else:
        # 3x3 Laplacian sharpening kernel with center = 1 + 4*strength
        kernel = np.array([
            [0, -strength, 0],
            [-strength, 1 + 4 * strength, -strength],
            [0, -strength, 0]
        ], dtype=np.float32)
        sharpened = cv2.filter2D(img, -1, kernel)
        return np.clip(sharpened, 0, 255).astype(np.uint8)
