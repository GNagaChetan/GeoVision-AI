import os
import time
import uuid
import numpy as np
import cv2
from typing import Dict, Any, Tuple, Optional, List

from app.core.config import settings
from app.models.schemas import (
    HistogramData,
    ImageStats,
    DIPProcessResponse,
    ImageQualityResponse,
    ImageRegistrationResponse
)

from .io import (
    load_image,
    load_image_rgb,
    load_image_gray,
    validate_image,
    extract_metadata,
    simulate_sampling,
    simulate_quantization,
    convert_color_spaces
)
from .histogram import (
    compute_histogram,
    compute_cdf,
    compute_histogram_stats
)
from .enhancement import (
    histogram_equalization,
    clahe,
    contrast_stretching,
    gamma_correction,
    log_transform
)
from .filters import (
    mean_filter,
    median_filter,
    gaussian_filter,
    sharpen
)
from .edges import (
    sobel_edge,
    prewitt_edge,
    roberts_edge,
    canny_edge
)
from .thresholding import (
    global_threshold,
    otsu_threshold,
    adaptive_threshold
)
from .segmentation import (
    multi_otsu_segmentation,
    kmeans_segmentation,
    watershed_segmentation
)
from .frequency import (
    fft2d_spectrum,
    frequency_filter
)
from .restoration import (
    add_noise,
    denoise_nlmeans,
    wiener_deconvolution,
    inpaint_restoration
)
from .metrics import (
    compute_psnr,
    compute_ssim,
    compute_mse,
    compute_contrast,
    compute_entropy,
    interpret_quality_metrics
)
from .registration import (
    register_images
)
from .texture import (
    glcm_texture_analysis,
    local_binary_patterns
)

class DIPService:
    """
    Unified Digital Image Processing Engine orchestrating all modular image processing services.
    Adheres to Gonzalez & Woods academic foundations with zero hallucination.
    """

    @staticmethod
    def load_image(image_path: str) -> np.ndarray:
        return load_image(image_path)

    @staticmethod
    def compute_stats(img: np.ndarray) -> ImageStats:
        meta = extract_metadata(img)
        return ImageStats(
            width=meta["width"],
            height=meta["height"],
            channels=meta["channels"],
            min_val=meta["min_intensity"],
            max_val=meta["max_intensity"],
            mean_val=meta["mean_intensity"],
            std_val=meta["std_deviation"],
            contrast=meta["michelson_contrast"]
        )

    @staticmethod
    def compute_histogram(img: np.ndarray) -> HistogramData:
        return compute_histogram(img)

    @staticmethod
    def save_processed_image(img: np.ndarray, prefix: str = "proc") -> Tuple[str, str]:
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
        abs_path = os.path.join(settings.PROCESSED_DIR, filename)
        if img.dtype != np.uint8:
            img = np.clip(img, 0, 255).astype(np.uint8)
        cv2.imwrite(abs_path, img)
        rel_url = f"/api/v1/processed/{filename}"
        return abs_path, rel_url

    def apply_operation(self, image_path: str, operation: str, params: Dict[str, Any]) -> DIPProcessResponse:
        """
        Executes specified DIP algorithm and returns full mathematical & telemetry payload.
        """
        start_time = time.time()
        orig_img = self.load_image(image_path)
        stats_orig = self.compute_stats(orig_img)
        hist_orig = self.compute_histogram(orig_img)

        formula = None
        reference = "Gonzalez & Woods, Digital Image Processing (4th Edition)"
        op = operation.lower()
        proc_img: np.ndarray

        # 1. Enhancement
        if op in ["equalize", "histogram_equalization"]:
            proc_img = histogram_equalization(orig_img)
            formula = r"s_k = T(r_k) = (L - 1) \sum_{j=0}^k p_r(r_j)"
            reference = "Gonzalez & Woods (2018), Chapter 3: Histogram Processing"

        elif op in ["clahe", "adaptive_equalization"]:
            clip = float(params.get("clip_limit", 2.0))
            grid = int(params.get("tile_grid_size", 8))
            proc_img = clahe(orig_img, clip_limit=clip, tile_grid_size=grid)
            formula = r"\text{CLAHE with Rayleigh/Uniform clipping limit } \beta"
            reference = "Zuiderveld (1994), Contrast Limited Adaptive Histogram Equalization"

        elif op in ["contrast_stretch", "linear_stretch"]:
            p_low = float(params.get("p_low", 2.0))
            p_high = float(params.get("p_high", 98.0))
            proc_img = contrast_stretching(orig_img, p_low=p_low, p_high=p_high)
            formula = r"s = \text{clip}\left((r - v_{\min})\frac{255}{v_{\max} - v_{\min}}, 0, 255\right)"
            reference = "Lillesand, Kiefer & Chipman (2015), Radiometric Contrast Enhancement"

        elif op in ["gamma_correction", "gamma"]:
            gamma = float(params.get("gamma", 1.0))
            proc_img = gamma_correction(orig_img, gamma=gamma)
            formula = r"s = c \cdot r^{\gamma}"
            reference = "Gonzalez & Woods (2018), Chapter 3: Power-Law Intensity Transformations"

        elif op in ["log_transform", "log"]:
            c = float(params.get("c", 1.0))
            proc_img = log_transform(orig_img, c=c)
            formula = r"s = c \cdot \log(1 + r)"
            reference = "Gonzalez & Woods (2018), Chapter 3: Logarithmic Dynamic Range Transformations"

        # 2. Spatial Filtering
        elif op in ["mean_filter", "mean", "blur"]:
            k = int(params.get("kernel_size", 5))
            proc_img = mean_filter(orig_img, kernel_size=k)
            formula = r"g(x, y) = \frac{1}{N^2} \sum_{s=-a}^a \sum_{t=-b}^b f(x+s, y+t)"
            reference = "Gonzalez & Woods (2018), Chapter 3: Spatial Filtering & Smoothing"

        elif op in ["median_filter", "median", "despeckle"]:
            k = int(params.get("kernel_size", 5))
            proc_img = median_filter(orig_img, kernel_size=k)
            formula = r"g(x, y) = \text{median}\{f(x+s, y+t) \mid (s, t) \in S_{xy}\}"
            reference = "Gonzalez & Woods (2018), Order-Statistic Spatial Filters"

        elif op in ["gaussian_filter", "gaussian"]:
            k = int(params.get("kernel_size", 5))
            sigma = float(params.get("sigma", 1.5))
            proc_img = gaussian_filter(orig_img, kernel_size=k, sigma=sigma)
            formula = r"G(x, y) = \frac{1}{2\pi\sigma^2} e^{-\frac{x^2+y^2}{2\sigma^2}}"
            reference = "Gonzalez & Woods (2018), 2D Isotropic Gaussian Spatial Convolution"

        elif op in ["sharpen", "laplacian"]:
            strength = float(params.get("strength", 1.2))
            method = str(params.get("method", "laplacian"))
            proc_img = sharpen(orig_img, strength=strength, method=method)
            formula = r"g(x, y) = f(x, y) - k \cdot \nabla^2 f(x, y)"
            reference = "Gonzalez & Woods (2018), Laplacian 2nd Order Derivative Sharpening"

        # 3. Edge Detection
        elif op in ["sobel", "sobel_edge"]:
            k = int(params.get("kernel_size", 3))
            direction = str(params.get("direction", "both"))
            edge_map = sobel_edge(orig_img, kernel_size=k, direction=direction)
            proc_img = cv2.cvtColor(edge_map, cv2.COLOR_GRAY2BGR) if len(orig_img.shape) == 3 else edge_map
            formula = r"|G| = \sqrt{G_x^2 + G_y^2}, \quad G_x = [-1, 0, 1; -2, 0, 2; -1, 0, 1]"
            reference = "Gonzalez & Woods (2018), Chapter 10: Sobel Gradient Edge Operators"

        elif op in ["prewitt", "prewitt_edge"]:
            edge_map = prewitt_edge(orig_img)
            proc_img = cv2.cvtColor(edge_map, cv2.COLOR_GRAY2BGR) if len(orig_img.shape) == 3 else edge_map
            formula = r"|G| = \sqrt{G_x^2 + G_y^2}, \quad G_x = [-1, 0, 1; -1, 0, 1; -1, 0, 1]"
            reference = "Prewitt (1970), Object Enhancement and Extraction"

        elif op in ["roberts", "roberts_edge"]:
            edge_map = roberts_edge(orig_img)
            proc_img = cv2.cvtColor(edge_map, cv2.COLOR_GRAY2BGR) if len(orig_img.shape) == 3 else edge_map
            formula = r"|G| = \sqrt{(z_9 - z_5)^2 + (z_8 - z_6)^2}"
            reference = "Roberts (1965), Machine Perception of Three-Dimensional Solids"

        elif op in ["canny", "canny_edge"]:
            t1 = float(params.get("threshold1", 50.0))
            t2 = float(params.get("threshold2", 150.0))
            edge_map = canny_edge(orig_img, threshold1=t1, threshold2=t2)
            proc_img = cv2.cvtColor(edge_map, cv2.COLOR_GRAY2BGR) if len(orig_img.shape) == 3 else edge_map
            formula = r"\text{Canny: } G_{\sigma} \ast f \to \nabla \to \text{NMS} \to \text{Hysteresis}(T_1, T_2)"
            reference = "Canny (1986), A Computational Approach to Edge Detection"

        # 4. Thresholding & Segmentation
        elif op in ["otsu", "otsu_threshold"]:
            _, binary = otsu_threshold(orig_img)
            proc_img = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR) if len(orig_img.shape) == 3 else binary
            formula = r"\sigma_B^2(k) = \frac{[m_G P_1(k) - m(k)]^2}{P_1(k)(1 - P_1(k))}"
            reference = "Otsu (1979), A Threshold Selection Method from Gray-Level Histograms"

        elif op in ["adaptive_thresh", "adaptive_threshold"]:
            bs = int(params.get("block_size", 11))
            c = float(params.get("c_val", 2.0))
            method = str(params.get("method", "gaussian"))
            binary = adaptive_threshold(orig_img, block_size=bs, c_val=c, method=method)
            proc_img = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR) if len(orig_img.shape) == 3 else binary
            formula = r"T(x, y) = \text{Mean}_{S_{xy}}(f) - C"
            reference = "Gonzalez & Woods (2018), Chapter 10: Local Adaptive Thresholding"

        elif op in ["multi_otsu", "multi_otsu_segmentation"]:
            num_classes = int(params.get("classes", 3))
            _, color_map = multi_otsu_segmentation(orig_img, classes=num_classes)
            proc_img = color_map
            formula = r"\text{Multi-Otsu: } \sigma_B^2(k_1, k_2, \dots, k_{C-1}) = \sum_{j=1}^C \omega_j (\mu_j - \mu_T)^2"
            reference = "Liao, Chen & Chung (2001), A Fast Algorithm for Multilevel Thresholding"

        elif op in ["kmeans", "kmeans_segmentation"]:
            k = int(params.get("k", 4))
            proc_img = kmeans_segmentation(orig_img, k=k)
            formula = r"J = \sum_{j=1}^K \sum_{i=1}^n \|x_i^{(j)} - c_j\|^2"
            reference = "MacQueen (1967), Some Methods for Classification & Analysis of Multivariate Observations"

        elif op in ["watershed", "watershed_segmentation"]:
            proc_img = watershed_segmentation(orig_img)
            formula = r"\text{Morphological Gradient Watershed Topology}"
            reference = "Vincent & Soille (1991), Watersheds in Digital Spaces"

        # 5. Frequency Domain
        elif op in ["fft", "fft_spectrum"]:
            spectrum, _ = fft2d_spectrum(orig_img)
            proc_img = spectrum
            formula = r"F(u, v) = \sum_{x=0}^{M-1} \sum_{y=0}^{N-1} f(x, y) e^{-j 2\pi (\frac{ux}{M} + \frac{vy}{N})}"
            reference = "Gonzalez & Woods (2018), Chapter 4: Filtering in the Frequency Domain"

        elif op in ["freq_filter", "frequency_filter"]:
            filter_type = str(params.get("filter_type", "ideal_lowpass"))
            cutoff = float(params.get("cutoff", 30.0))
            order = int(params.get("order", 2))
            filtered_gray = frequency_filter(orig_img, filter_type=filter_type, cutoff=cutoff, order=order)
            proc_img = cv2.cvtColor(filtered_gray, cv2.COLOR_GRAY2BGR) if len(orig_img.shape) == 3 else filtered_gray
            formula = r"G(u, v) = H(u, v) \cdot F(u, v)"
            reference = "Gonzalez & Woods (2018), Chapter 4: 2D Fourier Transfer Functions"

        # 6. Restoration & Noise
        elif op in ["add_noise", "noise"]:
            nt = str(params.get("noise_type", "gaussian"))
            var = float(params.get("var", 0.01))
            proc_img = add_noise(orig_img, noise_type=nt, var=var)
            formula = r"g(x, y) = f(x, y) + \eta(x, y), \quad \eta \sim \mathcal{N}(\mu, \sigma^2)"
            reference = "Gonzalez & Woods (2018), Chapter 5: Image Restoration and Degradation Models"

        elif op in ["denoise_nlmeans", "nlmeans"]:
            h = float(params.get("h", 10.0))
            proc_img = denoise_nlmeans(orig_img, h=h)
            formula = r"\hat{f}(x) = \sum_y w(x, y) f(y), \quad w(x, y) = \frac{1}{Z(x)} e^{-\frac{\|v(N_x) - v(N_y)\|^2}{h^2}}"
            reference = "Buades, Coll & Morel (2005), A Non-Local Algorithm for Image Denoising"

        elif op in ["wiener", "wiener_filter"]:
            ks = int(params.get("kernel_size", 5))
            proc_img = wiener_deconvolution(orig_img, kernel_size=ks)
            formula = r"H_w(u, v) = \frac{H^*(u, v)}{|H(u, v)|^2 + S_\eta(u, v) / S_f(u, v)}"
            reference = "Wiener (1949), Extrapolation, Interpolation and Smoothing of Stationary Time Series"

        elif op in ["inpaint", "inpainting"]:
            proc_img = inpaint_restoration(orig_img)
            formula = r"\text{Fast Marching Telea Inpainting PDE along isophotes}"
            reference = "Telea (2004), An Image Inpainting Technique Based on the Fast Marching Method"

        # 7. Sampling & Quantization Demo
        elif op in ["sampling_demo", "sampling"]:
            factor = int(params.get("factor", 4))
            sampled, meta = simulate_sampling(orig_img, factor=factor)
            proc_img = sampled
            formula = r"f_s(x, y) = f(x, y) \cdot \sum_{m} \sum_{n} \delta(x - m\Delta x, y - n\Delta y)"
            reference = "Gonzalez & Woods (2018), Chapter 2: Spatial Sampling & Resolution"

        elif op in ["quantization_demo", "quantization"]:
            levels = int(params.get("levels", 8))
            quantized, meta = simulate_quantization(orig_img, levels=levels)
            proc_img = quantized
            formula = r"q(r) = \left\lfloor \frac{r}{256/L} \right\rfloor \cdot \frac{255}{L - 1}, \quad b = \log_2(L)"
            reference = "Gonzalez & Woods (2018), Chapter 2: Intensity Quantization & False Contouring"

        # 8. Texture Analysis
        elif op in ["lbp", "local_binary_patterns"]:
            p = int(params.get("points", 8))
            r = float(params.get("radius", 1.0))
            lbp_color, _ = local_binary_patterns(orig_img, num_points=p, radius=r)
            proc_img = lbp_color
            formula = r"\text{LBP}_{P, R}(x_c, y_c) = \sum_{p=0}^{P-1} s(g_p - g_c) 2^p"
            reference = "Ojala, Pietikainen & Maenpaa (2002), Multiresolution Gray-Scale Texture Classification"

        else:
            raise ValueError(f"Unsupported DIP operation: '{operation}'.")

        # Save processed output image to storage cache
        abs_path, rel_url = self.save_processed_image(proc_img, prefix=op)
        stats_proc = self.compute_stats(proc_img)
        hist_proc = self.compute_histogram(proc_img)

        # Original relative URL
        orig_filename = os.path.basename(image_path)
        orig_rel_url = f"/api/v1/samples/{orig_filename}" if "sample" in image_path else f"/api/v1/uploads/{orig_filename}"

        exec_time = round((time.time() - start_time) * 1000.0, 2)

        return DIPProcessResponse(
            success=True,
            operation=operation,
            output_image_url=rel_url,
            original_image_url=orig_rel_url,
            stats_original=stats_orig,
            stats_processed=stats_proc,
            histogram_original=hist_orig,
            histogram_processed=hist_proc,
            parameters_applied=params,
            academic_reference=reference,
            mathematical_formula=formula,
            execution_time_ms=exec_time
        )

    def evaluate_quality(self, reference_path: str, distorted_path: str) -> ImageQualityResponse:
        """Evaluate PSNR, SSIM, and MSE between reference and distorted images."""
        ref_img = self.load_image(reference_path)
        dist_img = self.load_image(distorted_path)
        psnr_val = compute_psnr(ref_img, dist_img)
        ssim_val = compute_ssim(ref_img, dist_img)
        mse_val = compute_mse(ref_img, dist_img)
        interp = interpret_quality_metrics(psnr_val, ssim_val, mse_val)
        return ImageQualityResponse(
            psnr=psnr_val,
            ssim=ssim_val,
            mse=mse_val,
            interpretation=interp
        )

    def register_images(self, reference_path: str, moving_path: str, feature_type: str = "ORB") -> ImageRegistrationResponse:
        """Perform sub-pixel feature registration between reference and moving image."""
        ref_img = self.load_image(reference_path)
        mov_img = self.load_image(moving_path)
        res = register_images(ref_img, mov_img, feature_type=feature_type)
        _, reg_url = self.save_processed_image(res["registered_image"], prefix="reg")
        _, diff_url = self.save_processed_image(res["difference_image"], prefix="diff")
        return ImageRegistrationResponse(
            success=res["success"],
            num_matches=res["num_matches"],
            homography_matrix=res["homography_matrix"],
            registered_image_url=reg_url,
            difference_image_url=diff_url,
            alignment_error=res["alignment_error"],
            message=res.get("message")
        )

dip_service = DIPService()
