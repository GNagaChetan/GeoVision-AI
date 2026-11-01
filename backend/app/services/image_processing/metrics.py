import numpy as np
import cv2
from typing import Dict, Any, Tuple
from skimage.metrics import peak_signal_noise_ratio, structural_similarity

def _match_shapes(ref: np.ndarray, dist: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Ensures reference and distorted images have identical dimensions and channel count."""
    h_ref, w_ref = ref.shape[:2]
    h_dist, w_dist = dist.shape[:2]

    if (h_ref, w_ref) != (h_dist, w_dist):
        dist_resized = cv2.resize(dist, (w_ref, h_ref), interpolation=cv2.INTER_LINEAR)
    else:
        dist_resized = dist

    # Match channels
    if len(ref.shape) == 2 and len(dist_resized.shape) == 3:
        dist_matched = cv2.cvtColor(dist_resized, cv2.COLOR_BGR2GRAY)
        ref_matched = ref
    elif len(ref.shape) == 3 and len(dist_resized.shape) == 2:
        dist_matched = cv2.cvtColor(dist_resized, cv2.COLOR_GRAY2BGR)
        ref_matched = ref
    else:
        ref_matched = ref
        dist_matched = dist_resized

    return ref_matched, dist_matched

def compute_mse(ref: np.ndarray, dist: np.ndarray) -> float:
    """
    Mean Squared Error:
    MSE = (1 / (M * N)) * sum_{x=0}^{M-1} sum_{y=0}^{N-1} [I_ref(x, y) - I_dist(x, y)]^2
    """
    ref_m, dist_m = _match_shapes(ref, dist)
    err = np.sum((ref_m.astype(np.float64) - dist_m.astype(np.float64)) ** 2)
    mse = float(err / float(ref_m.shape[0] * ref_m.shape[1] * (ref_m.shape[2] if len(ref_m.shape) == 3 else 1)))
    return round(mse, 4)

def compute_psnr(ref: np.ndarray, dist: np.ndarray) -> float:
    """
    Peak Signal-to-Noise Ratio (PSNR in decibels):
    PSNR = 10 * log10( (MAX_I)^2 / MSE )
    """
    ref_m, dist_m = _match_shapes(ref, dist)
    psnr_val = peak_signal_noise_ratio(ref_m, dist_m, data_range=255)
    if np.isinf(psnr_val):
        return 100.0 # Identical images
    return round(float(psnr_val), 2)

def compute_ssim(ref: np.ndarray, dist: np.ndarray) -> float:
    """
    Structural Similarity Index (SSIM):
    SSIM(x, y) = [ (2*mu_x*mu_y + c1)*(2*sigma_xy + c2) ] / [ (mu_x^2 + mu_y^2 + c1)*(sigma_x^2 + sigma_y^2 + c2) ]
    """
    ref_m, dist_m = _match_shapes(ref, dist)
    channel_axis = 2 if len(ref_m.shape) == 3 else None
    ssim_val = structural_similarity(ref_m, dist_m, data_range=255, channel_axis=channel_axis)
    return round(float(ssim_val), 4)

def compute_contrast(img: np.ndarray) -> Dict[str, float]:
    """
    Computes Michelson contrast and RMS contrast of the scene.
    """
    if len(img.shape) == 3 and img.shape[2] >= 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    elif len(img.shape) == 3:
        gray = img[:, :, 0]
    else:
        gray = img

    min_val = float(np.min(gray))
    max_val = float(np.max(gray))
    mean_val = float(np.mean(gray))

    michelson = float((max_val - min_val) / (max_val + min_val + 1e-6))
    rms = float(np.sqrt(np.mean((gray.astype(np.float64) - mean_val) ** 2)))

    return {
        "michelson_contrast": round(michelson, 4),
        "rms_contrast": round(rms, 4)
    }

def compute_entropy(img: np.ndarray) -> float:
    """
    Computes Shannon Information Entropy: H = -sum(p * log2(p))
    """
    if len(img.shape) == 3 and img.shape[2] >= 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    elif len(img.shape) == 3:
        gray = img[:, :, 0]
    else:
        gray = img

    hist, _ = np.histogram(gray, bins=256, range=(0, 256), density=True)
    hist = hist[hist > 0]
    entropy = float(-np.sum(hist * np.log2(hist))) if len(hist) > 0 else 0.0
    return round(entropy, 4)

def interpret_quality_metrics(psnr: float, ssim: float, mse: float) -> str:
    """
    Returns an academic interpretation of the quantitative fidelity metrics.
    """
    if ssim >= 0.95 and psnr >= 35.0:
        return "Excellent fidelity. Imperceptible structural distortion with high signal preservation."
    elif ssim >= 0.85 and psnr >= 28.0:
        return "Good quality. Minor compression or filtering artifacts with preserved geometric features."
    elif ssim >= 0.70:
        return "Moderate distortion. Edge boundaries preserved but perceptible texture smoothing or contrast modification."
    else:
        return "Substantial alteration. High-frequency structural divergence from reference scene."
