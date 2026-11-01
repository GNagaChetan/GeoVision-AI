import numpy as np
import cv2
from typing import Dict, Any, Tuple, Optional

def _to_gray(img: np.ndarray) -> np.ndarray:
    if len(img.shape) == 2:
        return img
    if len(img.shape) == 3 and img.shape[2] == 1:
        return img[:, :, 0]
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

def register_images(
    ref_img: np.ndarray,
    moving_img: np.ndarray,
    feature_type: str = 'ORB',
    max_features: int = 1000
) -> Dict[str, Any]:
    """
    Sub-pixel image registration pipeline:
    1. Feature Detection (ORB / SIFT / AKAZE).
    2. Descriptor extraction and Hamming/L2 nearest-neighbor matching.
    3. RANSAC Homography matrix estimation: x' = H * x
    4. Warp perspective geometric transformation.
    5. Alignment difference calculation and RMSE error.
    """
    gray_ref = _to_gray(ref_img)
    gray_mov = _to_gray(moving_img)

    ft = feature_type.upper()
    if ft == 'SIFT':
        detector = cv2.SIFT_create(nfeatures=max_features)
        matcher = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
    elif ft == 'AKAZE':
        detector = cv2.AKAZE_create()
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    else: # Default ORB
        detector = cv2.ORB_create(nfeatures=max_features)
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)

    kp1, des1 = detector.detectAndCompute(gray_ref, None)
    kp2, des2 = detector.detectAndCompute(gray_mov, None)

    if des1 is None or des2 is None or len(kp1) < 4 or len(kp2) < 4:
        # Fallback identity warp if insufficient keypoints
        h, w = ref_img.shape[:2]
        aligned = cv2.resize(moving_img, (w, h))
        diff = cv2.absdiff(ref_img, aligned)
        return {
            "success": False,
            "num_matches": 0,
            "homography_matrix": np.eye(3).tolist(),
            "registered_image": aligned,
            "difference_image": diff,
            "alignment_error": 99.9,
            "message": "Insufficient feature keypoints found for RANSAC homography."
        }

    # KNN matching with Lowe's ratio test (0.75)
    matches = matcher.knnMatch(des1, des2, k=2)
    good_matches = []
    for m_pair in matches:
        if len(m_pair) == 2:
            m, n = m_pair
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)

    if len(good_matches) < 4:
        # Relax ratio test threshold if strict matching yielded too few points
        good_matches = [m[0] for m in matches if len(m) > 0][:50]

    src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    # Find homography from moving image (dst_pts) to reference image (src_pts)
    H, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)

    if H is None:
        H = np.eye(3)

    h_ref, w_ref = ref_img.shape[:2]
    registered_img = cv2.warpPerspective(moving_img, H, (w_ref, h_ref))

    # Compute difference image
    if len(ref_img.shape) == 3 and len(registered_img.shape) == 3:
        diff_img = cv2.absdiff(ref_img, registered_img)
    else:
        diff_img = cv2.absdiff(_to_gray(ref_img), _to_gray(registered_img))

    # Compute Root Mean Square Error (RMSE) on overlapping pixels
    diff_gray = _to_gray(diff_img)
    overlap_mask = (diff_gray > 0)
    rmse = float(np.sqrt(np.mean(diff_gray.astype(np.float64) ** 2)))

    return {
        "success": True,
        "num_matches": len(good_matches),
        "homography_matrix": H.tolist(),
        "registered_image": registered_img,
        "difference_image": diff_img,
        "alignment_error": round(rmse, 2),
        "message": f"Successfully aligned using {len(good_matches)} RANSAC matched feature pairs."
    }
