import numpy as np
import cv2
from typing import Dict, Any, Optional, Tuple
from scipy.signal import wiener

def add_noise(
    img: np.ndarray,
    noise_type: str = 'gaussian',
    mean: float = 0.0,
    var: float = 0.01,
    amount: float = 0.04
) -> np.ndarray:
    """
    Synthesizes controlled noise degradation models for algorithm benchmarking:
    - 'gaussian': Additive zero-mean Gaussian noise.
    - 'salt_and_pepper': Impulse noise replacing random pixels with 0 or 255.
    - 'speckle': Multiplicative SAR noise: g = f + n * f.
    """
    img_norm = img.astype(np.float64) / 255.0
    nt = noise_type.lower()

    if nt == 'gaussian':
        sigma = np.sqrt(max(0.0001, float(var)))
        gauss = np.random.normal(mean, sigma, img.shape)
        noisy = img_norm + gauss
    elif nt in ['salt_and_pepper', 'sp']:
        noisy = img_norm.copy()
        amt = max(0.001, min(float(amount), 0.5))
        # Salt (1.0)
        num_salt = np.ceil(amt * img.size * 0.5)
        coords = [np.random.randint(0, i - 1, int(num_salt)) for i in img.shape[:2]]
        noisy[tuple(coords)] = 1.0
        # Pepper (0.0)
        num_pepper = np.ceil(amt * img.size * 0.5)
        coords = [np.random.randint(0, i - 1, int(num_pepper)) for i in img.shape[:2]]
        noisy[tuple(coords)] = 0.0
    elif nt == 'speckle':
        gauss = np.random.normal(0, np.sqrt(max(0.001, float(var))), img.shape)
        noisy = img_norm + img_norm * gauss
    else:
        sigma = np.sqrt(max(0.0001, float(var)))
        gauss = np.random.normal(mean, sigma, img.shape)
        noisy = img_norm + gauss

    noisy_clipped = np.clip(noisy * 255.0, 0, 255).astype(np.uint8)
    return noisy_clipped

def denoise_nlmeans(img: np.ndarray, h: float = 10.0, template_window: int = 7, search_window: int = 21) -> np.ndarray:
    """
    Non-Local Means (NL-Means) spatial denoising.
    Averages self-similar patches across the search window to suppress noise while preserving fine terrain texture.
    """
    h_val = max(1.0, float(h))
    tw = max(3, int(template_window))
    if tw % 2 == 0:
        tw += 1
    sw = max(5, int(search_window))
    if sw % 2 == 0:
        sw += 1

    if len(img.shape) == 2:
        return cv2.fastNlMeansDenoising(img, None, h_val, tw, sw)
    elif len(img.shape) == 3 and img.shape[2] == 1:
        return cv2.fastNlMeansDenoising(img[:, :, 0], None, h_val, tw, sw)
    else:
        return cv2.fastNlMeansDenoisingColored(img, None, h_val, h_val, tw, sw)

def wiener_deconvolution(img: np.ndarray, kernel_size: int = 5, noise_var: float = 0.01) -> np.ndarray:
    """
    Wiener statistical inverse filter for restoration of blurred / degraded images.
    Minimizes expected mean squared error between restored image and true scene.
    """
    ks = max(3, int(kernel_size))
    if ks % 2 == 0:
        ks += 1

    if len(img.shape) == 2:
        restored = wiener(img.astype(np.float64), mysize=(ks, ks), noise=noise_var)
        return np.clip(restored, 0, 255).astype(np.uint8)
    elif len(img.shape) == 3 and img.shape[2] == 1:
        restored = wiener(img[:, :, 0].astype(np.float64), mysize=(ks, ks), noise=noise_var)
        return np.clip(restored, 0, 255).astype(np.uint8)
    else:
        channels = cv2.split(img)
        restored_channels = []
        for ch in channels:
            res_ch = wiener(ch.astype(np.float64), mysize=(ks, ks), noise=noise_var)
            restored_channels.append(np.clip(res_ch, 0, 255).astype(np.uint8))
        return cv2.merge(restored_channels)

def inpaint_restoration(img: np.ndarray, mask: Optional[np.ndarray] = None, radius: int = 3) -> np.ndarray:
    """
    Image Inpainting Restoration using Fast Marching Method (Telea) or Navier-Stokes PDE.
    Used for defective pixel repair, cloud shadow removal, and artifact interpolation.
    """
    if len(img.shape) == 2:
        bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    else:
        bgr = img

    # Generate default defect mask if not provided (e.g. synthetic cross/dead pixels)
    if mask is None or mask.size == 0:
        h, w = bgr.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        # Synthetic scratch / sensor line defect
        cv2.line(mask, (w // 4, h // 4), (3 * w // 4, 3 * h // 4), 255, thickness=2)
        cv2.circle(mask, (w // 2, h // 2), 12, 255, -1)

    r = max(1, int(radius))
    inpainted = cv2.inpaint(bgr, mask, r, cv2.INPAINT_TELEA)
    return inpainted
