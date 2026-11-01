import numpy as np
import cv2
from typing import Dict, Any, Tuple, List
from skimage.feature import graycomatrix, graycoprops, local_binary_pattern

def _to_gray(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 2:
        return img
    if len(img.shape) == 3 and img.shape[2] == 1:
        return img[:, :, 0]
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

def glcm_texture_analysis(
    img: np.ndarray,
    distances: List[int] = [1],
    angles: List[float] = [0, np.pi/4, np.pi/2, 3*np.pi/4]
) -> Dict[str, float]:
    """
    Haralick Texture Feature Extraction using Gray-Level Co-occurrence Matrix (GLCM).
    Extracts standard second-order statistical descriptors:
    1. Contrast: sum_{i, j} |i - j|^2 * p(i, j)
    2. Dissimilarity: sum_{i, j} |i - j| * p(i, j)
    3. Homogeneity (Inverse Difference Moment): sum_{i, j} (p(i, j) / (1 + (i - j)^2))
    4. Energy (Angular Second Moment): sum_{i, j} p(i, j)^2
    5. Correlation: sum_{i, j} ((i - mu_i)*(j - mu_j)*p(i, j)) / (sigma_i * sigma_j)
    6. ASM: sum_{i, j} p(i, j)^2
    """
    gray = _to_gray(img)
    # Quantize to 64 levels for robust co-occurrence matrix estimation
    gray_quantized = (gray // 4).astype(np.uint8)

    glcm = graycomatrix(
        gray_quantized,
        distances=distances,
        angles=angles,
        levels=64,
        symmetric=True,
        normed=True
    )

    contrast = float(np.mean(graycoprops(glcm, 'contrast')))
    dissimilarity = float(np.mean(graycoprops(glcm, 'dissimilarity')))
    homogeneity = float(np.mean(graycoprops(glcm, 'homogeneity')))
    energy = float(np.mean(graycoprops(glcm, 'energy')))
    correlation = float(np.mean(graycoprops(glcm, 'correlation')))
    asm = float(np.mean(graycoprops(glcm, 'ASM')))

    return {
        "glcm_contrast": round(contrast, 4),
        "glcm_dissimilarity": round(dissimilarity, 4),
        "glcm_homogeneity": round(homogeneity, 4),
        "glcm_energy": round(energy, 4),
        "glcm_correlation": round(correlation, 4),
        "glcm_asm": round(asm, 6)
    }

def local_binary_patterns(
    img: np.ndarray,
    num_points: int = 8,
    radius: float = 1.0
) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Local Binary Patterns (LBP) rotation-invariant uniform texture mapping:
    LBP_{P, R}(x_c, y_c) = sum_{p=0}^{P-1} s(g_p - g_c) * 2^p
    """
    gray = _to_gray(img)
    p = max(4, int(num_points))
    r = max(0.5, float(radius))

    lbp = local_binary_pattern(gray, p, r, method='uniform')
    lbp_norm = cv2.normalize(lbp, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    lbp_color = cv2.applyColorMap(lbp_norm, cv2.COLORMAP_MAGMA)

    # Compute histogram entropy of LBP codes
    hist, _ = np.histogram(lbp.ravel(), bins=int(p * (p - 1) + 3), range=(0, int(p * (p - 1) + 3)), density=True)
    valid_p = hist[hist > 0]
    lbp_entropy = float(-np.sum(valid_p * np.log2(valid_p))) if len(valid_p) > 0 else 0.0

    metrics = {
        "lbp_points": p,
        "lbp_radius": r,
        "lbp_entropy": round(lbp_entropy, 4)
    }

    return lbp_color, metrics
