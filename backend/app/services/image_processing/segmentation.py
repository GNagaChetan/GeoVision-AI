import numpy as np
import cv2
from typing import Dict, Any, Tuple, List
from skimage.filters import threshold_multiotsu

def _to_gray(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 2:
        return img
    if len(img.shape) == 3 and img.shape[2] == 1:
        return img[:, :, 0]
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

def multi_otsu_segmentation(img: np.ndarray, classes: int = 3) -> Tuple[List[float], np.ndarray]:
    """
    Multi-level Otsu thresholding partitioning the gray-level histogram into N distinct classes.
    Produces a segmented categorical image with distinct gray levels or colormap.
    """
    gray = _to_gray(img)
    num_classes = max(2, min(int(classes), 5))

    thresholds = threshold_multiotsu(gray, classes=num_classes)
    regions = np.digitize(gray, bins=thresholds)

    # Scale regions to 0-255 uint8
    scaled_regions = ((regions / (num_classes - 1)) * 255.0).astype(np.uint8)
    color_map = cv2.applyColorMap(scaled_regions, cv2.COLORMAP_JET)

    return [float(t) for t in thresholds], color_map

def kmeans_segmentation(img: np.ndarray, k: int = 4, max_iter: int = 100) -> np.ndarray:
    """
    Unsupervised K-Means clustering segmentation in RGB spectral feature space.
    Clusters pixels into K cluster centroids and re-maps each pixel to its centroid color.
    """
    k = max(2, min(int(k), 12))
    if len(img.shape) == 2:
        img_3ch = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.shape[2] == 1:
        img_3ch = cv2.cvtColor(img[:, :, 0], cv2.COLOR_GRAY2BGR)
    else:
        img_3ch = img

    pixel_values = img_3ch.reshape((-1, 3)).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, int(max_iter), 0.2)
    _, labels, centers = cv2.kmeans(pixel_values, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

    centers = np.uint8(centers)
    segmented_data = centers[labels.flatten()]
    segmented_image = segmented_data.reshape(img_3ch.shape)
    return segmented_image

def watershed_segmentation(img: np.ndarray) -> np.ndarray:
    """
    Topological Watershed segmentation using Otsu binarization, morphological opening,
    and Euclidean Distance Transform markers.
    """
    gray = _to_gray(img)
    if len(img.shape) == 2:
        bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    else:
        bgr = img

    # 1. Binary threshold
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # 2. Noise removal via morphological opening
    kernel = np.ones((3, 3), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)

    # 3. Sure background area via dilation
    sure_bg = cv2.dilate(opening, kernel, iterations=3)

    # 4. Sure foreground area via distance transform
    dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
    _, sure_fg = cv2.threshold(dist_transform, 0.5 * dist_transform.max(), 255, 0)

    # 5. Unknown boundary region
    sure_fg = np.uint8(sure_fg)
    unknown = cv2.subtract(sure_bg, sure_fg)

    # 6. Marker labelling
    _, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0

    # 7. Apply watershed
    markers = cv2.watershed(bgr, markers)
    segmented = bgr.copy()
    segmented[markers == -1] = [0, 0, 255] # Red boundary lines

    return segmented
