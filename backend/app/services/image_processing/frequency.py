import numpy as np
import cv2
from typing import Dict, Any, Tuple

def _to_gray(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 2:
        return img
    if len(img.shape) == 3 and img.shape[2] == 1:
        return img[:, :, 0]
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

def fft2d_spectrum(img: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Computes 2D Discrete Fourier Transform (2D-DFT), shifts low frequency DC component to center,
    and returns visualizable logarithmic magnitude spectrum:
    |F(u, v)| = c * log(1 + |F(u, v)|)
    and phase spectrum:
    phi(u, v) = arctan2(Im, Re)
    """
    gray = _to_gray(img)
    f = np.fft.fft2(gray.astype(np.float64))
    fshift = np.fft.fftshift(f)

    # Magnitude spectrum in log decibels
    magnitude = np.abs(fshift)
    magnitude_spectrum = np.log(1.0 + magnitude)
    norm_magnitude = cv2.normalize(magnitude_spectrum, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    color_spectrum = cv2.applyColorMap(norm_magnitude, cv2.COLORMAP_VIRIDIS)

    # Phase spectrum
    phase = np.angle(fshift)
    norm_phase = cv2.normalize(phase, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    return color_spectrum, norm_phase

def frequency_filter(img: np.ndarray, filter_type: str = 'ideal_lowpass', cutoff: float = 30.0, order: int = 2) -> np.ndarray:
    """
    Frequency domain filtering: G(u, v) = H(u, v) * F(u, v)
    Supported filters:
    - 'ideal_lowpass', 'ideal_highpass'
    - 'gaussian_lowpass', 'gaussian_highpass'
    - 'butterworth_lowpass', 'butterworth_highpass'
    """
    gray = _to_gray(img)
    rows, cols = gray.shape
    crow, ccol = rows // 2, cols // 2

    f = np.fft.fft2(gray.astype(np.float64))
    fshift = np.fft.fftshift(f)

    # Construct distance matrix D(u, v)
    u = np.arange(rows)
    v = np.arange(cols)
    v_grid, u_grid = np.meshgrid(v, u)
    d = np.sqrt((u_grid - crow) ** 2 + (v_grid - ccol) ** 2)

    d0 = max(1.0, float(cutoff))
    n = max(1, int(order))

    flt = filter_type.lower()
    if flt == 'ideal_lowpass':
        h = np.zeros((rows, cols), dtype=np.float64)
        h[d <= d0] = 1.0
    elif flt == 'ideal_highpass':
        h = np.ones((rows, cols), dtype=np.float64)
        h[d <= d0] = 0.0
    elif flt == 'gaussian_lowpass':
        h = np.exp(-(d ** 2) / (2 * (d0 ** 2)))
    elif flt == 'gaussian_highpass':
        h = 1.0 - np.exp(-(d ** 2) / (2 * (d0 ** 2)))
    elif flt == 'butterworth_lowpass':
        h = 1.0 / (1.0 + (d / (d0 + 1e-6)) ** (2 * n))
    elif flt == 'butterworth_highpass':
        h = 1.0 / (1.0 + (d0 / (d + 1e-6)) ** (2 * n))
    else:
        # Default Gaussian lowpass
        h = np.exp(-(d ** 2) / (2 * (d0 ** 2)))

    # Apply filter in frequency domain
    fshift_filtered = fshift * h

    # Inverse 2D-FFT
    f_ishift = np.fft.ifftshift(fshift_filtered)
    img_back = np.fft.ifft2(f_ishift)
    img_back = np.abs(img_back)

    filtered_img = np.clip(img_back, 0, 255).astype(np.uint8)
    return filtered_img
