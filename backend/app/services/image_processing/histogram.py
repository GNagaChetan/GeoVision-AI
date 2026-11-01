import numpy as np
import cv2
from typing import Dict, Any, List
from app.models.schemas import HistogramData

def compute_histogram(img: np.ndarray) -> HistogramData:
    """
    Compute 256-bin histogram for grayscale or RGB channels.
    """
    bins = list(range(256))
    if len(img.shape) == 2 or img.shape[2] == 1:
        gray = img if len(img.shape) == 2 else img[:, :, 0]
        hist_gray = cv2.calcHist([gray.astype(np.uint8)], [0], None, [256], [0, 256]).flatten().tolist()
        return HistogramData(bins=bins, counts_gray=[int(x) for x in hist_gray])
    else:
        # OpenCV loads as BGR; split channels
        hist_b = cv2.calcHist([img], [0], None, [256], [0, 256]).flatten().tolist()
        hist_g = cv2.calcHist([img], [1], None, [256], [0, 256]).flatten().tolist()
        hist_r = cv2.calcHist([img], [2], None, [256], [0, 256]).flatten().tolist()
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hist_gray = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten().tolist()

        return HistogramData(
            bins=bins,
            counts_r=[int(x) for x in hist_r],
            counts_g=[int(x) for x in hist_g],
            counts_b=[int(x) for x in hist_b],
            counts_gray=[int(x) for x in hist_gray]
        )

def compute_cdf(img: np.ndarray) -> np.ndarray:
    """
    Computes normalized Cumulative Distribution Function (CDF) of the grayscale image:
    CDF(k) = sum_{j=0}^k p(j)
    """
    if len(img.shape) == 3 and img.shape[2] >= 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    elif len(img.shape) == 3:
        gray = img[:, :, 0]
    else:
        gray = img

    hist, _ = np.histogram(gray.flatten(), bins=256, range=[0, 256])
    cdf = hist.cumsum()
    cdf_normalized = cdf / (cdf.max() + 1e-6)
    return cdf_normalized

def compute_histogram_stats(img: np.ndarray) -> Dict[str, float]:
    """
    Computes statistical moments of the gray-level probability density:
    Mean, Variance, Standard Deviation, Skewness, Kurtosis, Uniformity (Energy), and Shannon Entropy.
    """
    if len(img.shape) == 3 and img.shape[2] >= 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    elif len(img.shape) == 3:
        gray = img[:, :, 0]
    else:
        gray = img

    hist, _ = np.histogram(gray.flatten(), bins=256, range=[0, 256], density=True)
    bins = np.arange(256)

    # 1. Mean (1st moment)
    mean = float(np.sum(bins * hist))

    # 2. Variance (2nd central moment)
    variance = float(np.sum(((bins - mean) ** 2) * hist))
    std_dev = float(np.sqrt(variance))

    # 3. Skewness (3rd standardized moment)
    skewness = float(np.sum(((bins - mean) ** 3) * hist) / (std_dev ** 3 + 1e-6))

    # 4. Kurtosis (4th standardized moment)
    kurtosis = float(np.sum(((bins - mean) ** 4) * hist) / (std_dev ** 4 + 1e-6))

    # 5. Energy (Uniformity) U = sum(p^2)
    uniformity = float(np.sum(hist ** 2))

    # 6. Entropy H = -sum(p * log2(p))
    valid_p = hist[hist > 0]
    entropy = float(-np.sum(valid_p * np.log2(valid_p))) if len(valid_p) > 0 else 0.0

    return {
        "histogram_mean": round(mean, 2),
        "histogram_variance": round(variance, 2),
        "histogram_std_dev": round(std_dev, 2),
        "histogram_skewness": round(skewness, 4),
        "histogram_kurtosis": round(kurtosis, 4),
        "histogram_uniformity_energy": round(uniformity, 6),
        "histogram_entropy": round(entropy, 4)
    }
