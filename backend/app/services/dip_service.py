import os
import time
import uuid
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, Tuple, Optional, List
from skimage.metrics import peak_signal_noise_ratio as compute_psnr
from skimage.metrics import structural_similarity as compute_ssim
from skimage.filters import threshold_multiotsu
from app.core.config import settings
from app.models.schemas import (
    HistogramData,
    ImageStats,
    DIPProcessResponse,
    ImageQualityResponse,
    ImageRegistrationResponse
)

class DIPService:
    """
    Digital Image Processing (DIP) Engine.
    Implements classical and advanced spatial and frequency domain image processing algorithms
    with academic references and mathematical formulas.
    """

    @staticmethod
    def load_image(image_path: str) -> np.ndarray:
        """Load image in BGR format with proper validation."""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")
        img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError(f"Failed to decode image from path: {image_path}")
        return img

    @staticmethod
    def compute_stats(img: np.ndarray) -> ImageStats:
        """Compute statistical properties of the image."""
        if len(img.shape) == 2:
            h, w = img.shape
            c = 1
            gray = img
        else:
            h, w, c = img.shape
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if c >= 3 else img[:, :, 0]

        min_val = float(np.min(gray))
        max_val = float(np.max(gray))
        mean_val = float(np.mean(gray))
        std_val = float(np.std(gray))
        # Michelson contrast = (Imax - Imin) / (Imax + Imin + eps)
        contrast = float((max_val - min_val) / (max_val + min_val + 1e-6))

        return ImageStats(
            width=w,
            height=h,
            channels=c,
            min_val=round(min_val, 2),
            max_val=round(max_val, 2),
            mean_val=round(mean_val, 2),
            std_val=round(std_val, 2),
            contrast=round(contrast, 4)
        )

    @staticmethod
    def compute_histogram(img: np.ndarray) -> HistogramData:
        """Compute 256-bin histogram for grayscale or RGB channels."""
        bins = list(range(256))
        if len(img.shape) == 2 or img.shape[2] == 1:
            gray = img if len(img.shape) == 2 else img[:, :, 0]
            hist_gray = cv2.calcHist([gray.astype(np.uint8)], [0], None, [256], [0, 256]).flatten().tolist()
            return HistogramData(bins=bins, counts_gray=[int(x) for x in hist_gray])
        else:
            # OpenCV loads as BGR
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

    @staticmethod
    def save_processed_image(img: np.ndarray, prefix: str = "proc") -> Tuple[str, str]:
        """Save image to processed directory and return (absolute_path, relative_url)."""
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
        abs_path = os.path.join(settings.PROCESSED_DIR, filename)
        # Ensure uint8 [0, 255]
        if img.dtype != np.uint8:
            img = np.clip(img, 0, 255).astype(np.uint8)
        cv2.imwrite(abs_path, img)
        rel_url = f"/api/v1/processed/{filename}"
        return abs_path, rel_url

    # -------------------------------------------------------------
    # Primary DIP Operations
    # -------------------------------------------------------------
    def apply_operation(self, image_path: str, operation: str, params: Dict[str, Any]) -> DIPProcessResponse:
        start_time = time.time()
        orig_img = self.load_image(image_path)
        stats_orig = self.compute_stats(orig_img)
        hist_orig = self.compute_histogram(orig_img)

        formula = None
        reference = "Gonzalez & Woods, Digital Image Processing, 4th Edition"
        op_lower = operation.lower()
        proc_img: np.ndarray

        if op_lower in ["equalize", "histogram_equalization"]:
            if len(orig_img.shape) == 2:
                proc_img = cv2.equalizeHist(orig_img)
            else:
                # Convert to YCrCb and equalize luminance channel
                ycrcb = cv2.cvtColor(orig_img, cv2.COLOR_BGR2YCrCb)
                ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
                proc_img = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
            formula = r"s_k = T(r_k) = (L-1)\sum_{j=0}^k p_r(r_j)"
            reference = "Gonzalez & Woods (2018), Chapter 3: Histogram Processing"

        elif op_lower in ["clahe", "adaptive_equalization"]:
            clip_limit = float(params.get("clip_limit", 2.0))
            tile_grid = int(params.get("tile_grid_size", 8))
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_grid, tile_grid))
            if len(orig_img.shape) == 2:
                proc_img = clahe.apply(orig_img)
            else:
                lab = cv2.cvtColor(orig_img, cv2.COLOR_BGR2LAB)
                lab[:, :, 0] = clahe.apply(lab[:, :, 0])
                proc_img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            formula = r"\text{CLAHE with Rayleigh/Uniform clipping threshold } \beta"
            reference = "Zuiderveld (1994), Contrast Limited Adaptive Histogram Equalization"

        elif op_lower in ["contrast_stretch", "linear_stretch"]:
            p_low = float(params.get("p_low", 2.0))
            p_high = float(params.get("p_high", 98.0))
            if len(orig_img.shape) == 2:
                v_min, v_max = np.percentile(orig_img, (p_low, p_high))
                proc_img = np.clip((orig_img - v_min) * (255.0 / (v_max - v_min + 1e-6)), 0, 255).astype(np.uint8)
            else:
                channels = cv2.split(orig_img)
                stretched = []
                for ch in channels:
                    v_min, v_max = np.percentile(ch, (p_low, p_high))
                    stretched.append(np.clip((ch - v_min) * (255.0 / (v_max - v_min + 1e-6)), 0, 255).astype(np.uint8))
                proc_img = cv2.merge(stretched)
            formula = r"g(x,y) = \frac{f(x,y) - f_{\min}}{f_{\max} - f_{\min}} \times 255"

        elif op_lower in ["mean_filter", "box_filter"]:
            ksize = int(params.get("kernel_size", 5))
            if ksize % 2 == 0: ksize += 1
            proc_img = cv2.blur(orig_img, (ksize, ksize))
            formula = r"g(x,y) = \frac{1}{M \cdot N}\sum_{i=-a}^a \sum_{j=-b}^b f(x+i, y+j)"

        elif op_lower in ["median_filter", "despeckle"]:
            ksize = int(params.get("kernel_size", 5))
            if ksize % 2 == 0: ksize += 1
            proc_img = cv2.medianBlur(orig_img, ksize)
            formula = r"g(x,y) = \text{median}\{f(x+i, y+j) \mid (i,j) \in S_{xy}\}"
            reference = "Gonzalez & Woods (2018), Non-linear Order-Statistic Filters"

        elif op_lower in ["gaussian_filter", "gaussian_blur"]:
            ksize = int(params.get("kernel_size", 5))
            sigma = float(params.get("sigma", 1.5))
            if ksize % 2 == 0: ksize += 1
            proc_img = cv2.GaussianBlur(orig_img, (ksize, ksize), sigma)
            formula = r"G(x,y) = \frac{1}{2\pi\sigma^2}\exp\left(-\frac{x^2+y^2}{2\sigma^2}\right)"

        elif op_lower in ["sharpen", "laplacian_sharpen"]:
            strength = float(params.get("strength", 1.0))
            blurred = cv2.GaussianBlur(orig_img, (0, 0), 3)
            # Unsharp mask formula: sharp = original + strength * (original - blurred)
            proc_img = cv2.addWeighted(orig_img, 1.0 + strength, blurred, -strength, 0)
            formula = r"g(x,y) = f(x,y) + k \cdot [f(x,y) - \bar{f}(x,y)]"

        elif op_lower in ["sobel", "sobel_edge"]:
            gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img
            ksize = int(params.get("kernel_size", 3))
            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=ksize)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=ksize)
            magnitude = np.sqrt(grad_x**2 + grad_y**2)
            proc_img = np.clip(magnitude * (255.0 / (np.max(magnitude) + 1e-6)), 0, 255).astype(np.uint8)
            formula = r"M(x,y) = \sqrt{G_x^2 + G_y^2} = \sqrt{(\partial f/\partial x)^2 + (\partial f/\partial y)^2}"

        elif op_lower in ["prewitt", "prewitt_edge"]:
            gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img
            kernel_x = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], dtype=np.float32)
            kernel_y = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], dtype=np.float32)
            gx = cv2.filter2D(gray.astype(np.float32), -1, kernel_x)
            gy = cv2.filter2D(gray.astype(np.float32), -1, kernel_y)
            mag = np.sqrt(gx**2 + gy**2)
            proc_img = np.clip(mag * (255.0 / (np.max(mag) + 1e-6)), 0, 255).astype(np.uint8)
            formula = r"\text{Prewitt kernels } K_x, K_y \text{ with gradient magnitude } \sqrt{G_x^2 + G_y^2}"

        elif op_lower in ["roberts", "roberts_cross"]:
            gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img
            kernel_x = np.array([[1, 0], [0, -1]], dtype=np.float32)
            kernel_y = np.array([[0, 1], [-1, 0]], dtype=np.float32)
            gx = cv2.filter2D(gray.astype(np.float32), -1, kernel_x)
            gy = cv2.filter2D(gray.astype(np.float32), -1, kernel_y)
            mag = np.sqrt(gx**2 + gy**2)
            proc_img = np.clip(mag * (255.0 / (np.max(mag) + 1e-6)), 0, 255).astype(np.uint8)
            formula = r"\text{Roberts Cross: } G_x = f(x,y) - f(x+1,y+1), \; G_y = f(x+1,y) - f(x,y+1)"

        elif op_lower in ["canny", "canny_edge"]:
            gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img
            thresh1 = float(params.get("threshold1", 50))
            thresh2 = float(params.get("threshold2", 150))
            proc_img = cv2.Canny(gray, int(thresh1), int(thresh2))
            formula = r"\text{Canny: Smoothing} \to \text{Gradients} \to \text{Non-Max Suppression} \to \text{Hysteresis}"
            reference = "Canny, J. (1986). A Computational Approach to Edge Detection. IEEE TPAMI."

        elif op_lower in ["otsu", "otsu_threshold"]:
            gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img
            _, proc_img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            formula = r"\sigma_B^2(t) = \omega_0(t)\omega_1(t)[\mu_0(t) - \mu_1(t)]^2"
            reference = "Otsu, N. (1979). A threshold selection method from gray-level histograms."

        elif op_lower in ["multi_otsu"]:
            gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img
            classes = int(params.get("classes", 3))
            thresholds = threshold_multiotsu(gray, classes=classes)
            regions = np.digitize(gray, bins=thresholds)
            proc_img = (regions * (255 // classes)).astype(np.uint8)
            formula = r"\text{Multi-class between-class variance maximization for } N \text{ classes}"

        elif op_lower in ["adaptive_thresh", "adaptive_threshold"]:
            gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img
            block_size = int(params.get("block_size", 11))
            if block_size % 2 == 0: block_size += 1
            c_val = float(params.get("c_val", 2))
            proc_img = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, c_val
            )
            formula = r"T(x,y) = \text{WeightedGaussian}(S_{xy}) - C"

        elif op_lower in ["fft", "fft_spectrum"]:
            # 2D Fast Fourier Transform Spectrum
            gray = cv2.cvtColor(orig_img, cv2.COLOR_BGR2GRAY) if len(orig_img.shape) == 3 else orig_img
            dft = np.fft.fft2(gray.astype(np.float32))
            dft_shift = np.fft.fftshift(dft)
            mag_spectrum = 20 * np.log(np.abs(dft_shift) + 1.0)
            proc_img = np.clip(mag_spectrum * (255.0 / (np.max(mag_spectrum) + 1e-6)), 0, 255).astype(np.uint8)
            formula = r"F(u,v) = \sum_{x=0}^{M-1}\sum_{y=0}^{N-1} f(x,y) e^{-j2\pi(\frac{ux}{M} + \frac{vy}{N})}, \; |F(u,v)|_{dB} = 20\log(1+|F|)"
            reference = "Gonzalez & Woods (2018), Chapter 4: Filtering in the Frequency Domain"

        elif op_lower in ["kmeans_segmentation"]:
            k = int(params.get("k", 4))
            data = orig_img.reshape((-1, 3)).astype(np.float32)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
            centers = np.uint8(centers)
            segmented_data = centers[labels.flatten()]
            proc_img = segmented_data.reshape(orig_img.shape)
            formula = r"\arg\min_S \sum_{i=1}^k \sum_{x \in S_i} \|x - \mu_i\|^2"

        else:
            raise ValueError(f"Unsupported operation '{operation}'.")

        # Save processed output
        abs_proc_path, rel_proc_url = self.save_processed_image(proc_img, prefix=op_lower[:6])
        stats_proc = self.compute_stats(proc_img)
        hist_proc = self.compute_histogram(proc_img)
        elapsed = (time.time() - start_time) * 1000.0

        # Save or link original for UI display
        _, rel_orig_url = self.save_processed_image(orig_img, prefix="orig")

        return DIPProcessResponse(
            success=True,
            operation=operation,
            output_image_url=rel_proc_url,
            original_image_url=rel_orig_url,
            stats_original=stats_orig,
            stats_processed=stats_proc,
            histogram_original=hist_orig,
            histogram_processed=hist_proc,
            parameters_applied=params,
            academic_reference=reference,
            mathematical_formula=formula,
            execution_time_ms=round(elapsed, 2)
        )

    # -------------------------------------------------------------
    # Image Quality Evaluation (PSNR, SSIM, MSE)
    # -------------------------------------------------------------
    def evaluate_quality(self, ref_path: str, dist_path: str) -> ImageQualityResponse:
        ref_img = self.load_image(ref_path)
        dist_img = self.load_image(dist_path)

        # Resize if dimensions differ
        if ref_img.shape != dist_img.shape:
            dist_img = cv2.resize(dist_img, (ref_img.shape[1], ref_img.shape[0]))

        if len(ref_img.shape) == 3:
            ref_gray = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)
            dist_gray = cv2.cvtColor(dist_img, cv2.COLOR_BGR2GRAY)
        else:
            ref_gray = ref_img
            dist_gray = dist_img

        mse = float(np.mean((ref_gray.astype(float) - dist_gray.astype(float)) ** 2))
        psnr_val = float(compute_psnr(ref_gray, dist_gray, data_range=255))
        ssim_val = float(compute_ssim(ref_gray, dist_gray, data_range=255))

        interp = (
            f"SSIM of {ssim_val:.3f} indicates {'high structural fidelity' if ssim_val > 0.85 else 'noticeable structural divergence'}. "
            f"PSNR of {psnr_val:.2f} dB represents {'excellent reconstruction quality' if psnr_val > 30 else 'moderate to high distortion'}."
        )

        return ImageQualityResponse(
            psnr=round(psnr_val, 2),
            ssim=round(ssim_val, 4),
            mse=round(mse, 4),
            interpretation=interp
        )

    # -------------------------------------------------------------
    # Image Registration (ORB + Homography)
    # -------------------------------------------------------------
    def register_images(self, ref_path: str, moving_path: str, feature_type: str = "ORB") -> ImageRegistrationResponse:
        ref = self.load_image(ref_path)
        moving = self.load_image(moving_path)

        ref_gray = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY) if len(ref.shape) == 3 else ref
        mov_gray = cv2.cvtColor(moving, cv2.COLOR_BGR2GRAY) if len(moving.shape) == 3 else moving

        orb = cv2.ORB_create(nfeatures=1500)
        kp1, des1 = orb.detectAndCompute(mov_gray, None)
        kp2, des2 = orb.detectAndCompute(ref_gray, None)

        if des1 is None or des2 is None or len(kp1) < 4 or len(kp2) < 4:
            raise ValueError("Insufficient feature keypoints detected for robust registration.")

        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)

        good_matches = matches[:min(100, len(matches))]
        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

        if H is None:
            raise ValueError("Failed to estimate Homography matrix with RANSAC.")

        h, w = ref_gray.shape
        registered = cv2.warpPerspective(moving, H, (w, h))

        # Absolute Difference Image
        reg_gray = cv2.cvtColor(registered, cv2.COLOR_BGR2GRAY) if len(registered.shape) == 3 else registered
        diff = cv2.absdiff(ref_gray, reg_gray)
        diff_colored = cv2.applyColorMap(diff, cv2.COLORMAP_JET)

        _, reg_url = self.save_processed_image(registered, prefix="reg")
        _, diff_url = self.save_processed_image(diff_colored, prefix="diff")

        error = float(np.mean(diff))

        return ImageRegistrationResponse(
            success=True,
            num_matches=len(good_matches),
            homography_matrix=[[round(float(v), 5) for v in row] for row in H.tolist()],
            registered_image_url=reg_url,
            difference_image_url=diff_url,
            alignment_error=round(error, 2)
        )

dip_service = DIPService()
