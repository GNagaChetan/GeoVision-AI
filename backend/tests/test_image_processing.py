import os
import sys
import json
import pytest
import numpy as np
import cv2
from io import BytesIO
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.core.config import settings
from app.services.image_processing import (
    DIPService,
    load_image,
    load_image_rgb,
    load_image_gray,
    validate_image,
    extract_metadata,
    simulate_sampling,
    simulate_quantization,
    convert_color_spaces,
    compute_histogram,
    compute_cdf,
    compute_histogram_stats,
    histogram_equalization,
    clahe,
    contrast_stretching,
    gamma_correction,
    log_transform,
    mean_filter,
    median_filter,
    gaussian_filter,
    sharpen,
    sobel_edge,
    prewitt_edge,
    roberts_edge,
    canny_edge,
    global_threshold,
    otsu_threshold,
    adaptive_threshold,
    multi_otsu_segmentation,
    kmeans_segmentation,
    watershed_segmentation,
    fft2d_spectrum,
    frequency_filter,
    add_noise,
    denoise_nlmeans,
    wiener_deconvolution,
    inpaint_restoration,
    compute_psnr,
    compute_ssim,
    compute_mse,
    compute_contrast,
    compute_entropy,
    interpret_quality_metrics,
    register_images,
    glcm_texture_analysis,
    local_binary_patterns
)

client = TestClient(app)

@pytest.fixture
def sample_image_path():
    p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
    assert os.path.exists(p), f"Sample image does not exist at {p}"
    return p

@pytest.fixture
def synthetic_image():
    """Create a 128x128 3-channel synthetic test pattern."""
    img = np.zeros((128, 128, 3), dtype=np.uint8)
    cv2.rectangle(img, (20, 20), (100, 100), (180, 120, 50), -1)
    cv2.circle(img, (64, 64), 30, (50, 200, 220), -1)
    cv2.line(img, (0, 0), (128, 128), (255, 255, 255), 2)
    return img

# =====================================================================
# 1. IO & Metadata & Conversion Tests
# =====================================================================
def test_io_loading_and_validation(sample_image_path, synthetic_image):
    img = load_image(sample_image_path)
    assert isinstance(img, np.ndarray)
    assert validate_image(img) is True

    rgb = load_image_rgb(sample_image_path)
    assert rgb.shape == img.shape

    gray = load_image_gray(sample_image_path)
    assert len(gray.shape) == 2

    meta = extract_metadata(img, path="test.png")
    assert meta["width"] == 512
    assert meta["height"] == 512
    assert "uint8" in meta["bit_depth"]
    assert "shannon_entropy" in meta
    assert "rms_contrast" in meta

def test_sampling_and_quantization(synthetic_image):
    downsampled, s_metrics = simulate_sampling(synthetic_image, factor=4)
    assert downsampled.shape == synthetic_image.shape
    assert s_metrics["sampling_factor"] == 4
    assert s_metrics["sampled_grid"] == "32x32"

    quantized, q_metrics = simulate_quantization(synthetic_image, levels=4)
    assert quantized.shape == synthetic_image.shape
    assert q_metrics["quantization_levels"] == 4
    assert "effective_bit_depth" in q_metrics

def test_color_spaces(synthetic_image):
    spaces = convert_color_spaces(synthetic_image)
    assert "bgr" in spaces
    assert "rgb" in spaces
    assert "hsv" in spaces
    assert "lab" in spaces
    assert "ycrcb" in spaces
    assert spaces["hsv"].shape == synthetic_image.shape
    assert spaces["lab"].shape == synthetic_image.shape
    assert spaces["ycrcb"].shape == synthetic_image.shape

# =====================================================================
# 2. Histogram & Enhancement Tests
# =====================================================================
def test_histogram_and_stats(synthetic_image):
    hist_data = compute_histogram(synthetic_image)
    assert len(hist_data.bins) == 256
    assert len(hist_data.counts_gray) == 256
    assert len(hist_data.counts_r) == 256

    cdf = compute_cdf(synthetic_image)
    assert len(cdf) == 256
    assert cdf[-1] == pytest.approx(1.0, abs=1e-4)

    stats = compute_histogram_stats(synthetic_image)
    assert "histogram_mean" in stats
    assert "histogram_variance" in stats
    assert "histogram_entropy" in stats
    assert stats["histogram_mean"] > 0

def test_enhancement_algorithms(synthetic_image):
    eq = histogram_equalization(synthetic_image)
    assert eq.shape == synthetic_image.shape

    cl = clahe(synthetic_image, clip_limit=2.0, tile_grid_size=8)
    assert cl.shape == synthetic_image.shape

    cs = contrast_stretching(synthetic_image, p_low=2, p_high=98)
    assert cs.shape == synthetic_image.shape

    gam = gamma_correction(synthetic_image, gamma=1.5)
    assert gam.shape == synthetic_image.shape

    lt = log_transform(synthetic_image)
    assert lt.shape == synthetic_image.shape

# =====================================================================
# 3. Spatial Filtering & Edge Detection Tests
# =====================================================================
def test_spatial_filters(synthetic_image):
    mf = mean_filter(synthetic_image, kernel_size=3)
    assert mf.shape == synthetic_image.shape

    med = median_filter(synthetic_image, kernel_size=3)
    assert med.shape == synthetic_image.shape

    gf = gaussian_filter(synthetic_image, kernel_size=5, sigma=1.0)
    assert gf.shape == synthetic_image.shape

    sh_lap = sharpen(synthetic_image, method="laplacian", strength=1.2)
    assert sh_lap.shape == synthetic_image.shape

    sh_unsharp = sharpen(synthetic_image, method="unsharp", strength=1.2)
    assert sh_unsharp.shape == synthetic_image.shape

def test_edge_detection(synthetic_image):
    sob_mag = sobel_edge(synthetic_image, kernel_size=3, direction="both")
    assert sob_mag.shape[:2] == synthetic_image.shape[:2]

    prew = prewitt_edge(synthetic_image)
    assert prew.shape[:2] == synthetic_image.shape[:2]

    rob = roberts_edge(synthetic_image)
    assert rob.shape[:2] == synthetic_image.shape[:2]

    can = canny_edge(synthetic_image, threshold1=50, threshold2=150)
    assert can.shape[:2] == synthetic_image.shape[:2]

# =====================================================================
# 4. Thresholding & Segmentation Tests
# =====================================================================
def test_thresholding(synthetic_image):
    th_glob = global_threshold(synthetic_image, thresh=127, method="binary")
    assert th_glob.shape[:2] == synthetic_image.shape[:2]

    val, th_otsu = otsu_threshold(synthetic_image)
    assert th_otsu.shape[:2] == synthetic_image.shape[:2]
    assert 0 <= val <= 255

    th_ad = adaptive_threshold(synthetic_image, block_size=11, c_val=2, method="gaussian")
    assert th_ad.shape[:2] == synthetic_image.shape[:2]

def test_segmentation(synthetic_image):
    thresholds, m_otsu = multi_otsu_segmentation(synthetic_image, classes=3)
    assert len(thresholds) == 2
    assert m_otsu.shape[:2] == synthetic_image.shape[:2]

    km = kmeans_segmentation(synthetic_image, k=3)
    assert km.shape == synthetic_image.shape

    ws = watershed_segmentation(synthetic_image)
    assert ws.shape == synthetic_image.shape

# =====================================================================
# 5. Frequency Domain & Restoration Tests
# =====================================================================
def test_frequency_domain(synthetic_image):
    mag_db, phase = fft2d_spectrum(synthetic_image)
    assert mag_db.shape[:2] == synthetic_image.shape[:2]
    assert phase.shape[:2] == synthetic_image.shape[:2]

    filt_gauss_low = frequency_filter(synthetic_image, filter_type="gaussian_lowpass", cutoff=30)
    assert filt_gauss_low.shape[:2] == synthetic_image.shape[:2]

    filt_butter_high = frequency_filter(synthetic_image, filter_type="butterworth_highpass", cutoff=30, order=2)
    assert filt_butter_high.shape[:2] == synthetic_image.shape[:2]

def test_restoration_and_noise(synthetic_image):
    noisy_gauss = add_noise(synthetic_image, noise_type="gaussian", var=0.02)
    assert noisy_gauss.shape == synthetic_image.shape

    noisy_sp = add_noise(synthetic_image, noise_type="salt_and_pepper", amount=0.05)
    assert noisy_sp.shape == synthetic_image.shape

    denoised_nlm = denoise_nlmeans(noisy_gauss, h=10)
    assert denoised_nlm.shape == synthetic_image.shape

    wiener_out = wiener_deconvolution(noisy_gauss, kernel_size=3)
    assert wiener_out.shape == synthetic_image.shape

    # Inpaint mask
    mask = np.zeros((128, 128), dtype=np.uint8)
    mask[50:60, 50:60] = 255
    inpainted = inpaint_restoration(synthetic_image, mask=mask, radius=3)
    assert inpainted.shape == synthetic_image.shape

# =====================================================================
# 6. Quality Metrics & Registration & Texture Tests
# =====================================================================
def test_quality_metrics(synthetic_image):
    # Identical image
    psnr_val = compute_psnr(synthetic_image, synthetic_image)
    assert psnr_val >= 90.0 or psnr_val == float("inf")

    ssim_val = compute_ssim(synthetic_image, synthetic_image)
    assert ssim_val == pytest.approx(1.0, abs=1e-3)

    mse_val = compute_mse(synthetic_image, synthetic_image)
    assert mse_val == pytest.approx(0.0, abs=1e-4)

    # Distorted image
    distorted = cv2.GaussianBlur(synthetic_image, (7, 7), 2.0)
    psnr_dist = compute_psnr(synthetic_image, distorted)
    ssim_dist = compute_ssim(synthetic_image, distorted)
    assert psnr_dist < 45.0
    assert ssim_dist < 1.0

    interp = interpret_quality_metrics(psnr_dist, ssim_dist, compute_mse(synthetic_image, distorted))
    assert isinstance(interp, str) and len(interp) > 0

    ent = compute_entropy(synthetic_image)
    assert ent > 0.0

    contrast_dict = compute_contrast(synthetic_image)
    assert 0.0 <= contrast_dict["michelson_contrast"] <= 1.0
    assert contrast_dict["rms_contrast"] >= 0.0

def test_image_registration(sample_image_path):
    img = load_image(sample_image_path)
    res = register_images(img, img, feature_type="ORB")
    assert res["success"] is True
    assert res["num_matches"] >= 4
    assert res["homography_matrix"] is not None
    assert res["alignment_error"] == pytest.approx(0.0, abs=1e-2)

def test_texture_analysis(synthetic_image):
    glcm = glcm_texture_analysis(synthetic_image)
    assert "glcm_contrast" in glcm
    assert "glcm_homogeneity" in glcm
    assert "glcm_energy" in glcm
    assert "glcm_correlation" in glcm
    assert "glcm_dissimilarity" in glcm
    assert "glcm_asm" in glcm

    lbp_map, lbp_stats = local_binary_patterns(synthetic_image, num_points=8, radius=1.0)
    assert lbp_map.shape[:2] == synthetic_image.shape[:2]
    assert "lbp_entropy" in lbp_stats

# =====================================================================
# 7. DIPService Master Dispatcher Tests
# =====================================================================
def test_dip_service_operations(sample_image_path):
    dip = DIPService()
    test_ops = [
        ("equalize", {}),
        ("clahe", {"clip_limit": 2.0, "tile_grid_size": 8}),
        ("contrast_stretch", {"p_low": 2, "p_high": 98}),
        ("gamma_correction", {"gamma": 1.5}),
        ("log_transform", {}),
        ("mean_filter", {"kernel_size": 3}),
        ("median_filter", {"kernel_size": 3}),
        ("gaussian_filter", {"kernel_size": 5, "sigma": 1.0}),
        ("sharpen", {"strength": 1.2}),
        ("sobel", {"kernel_size": 3}),
        ("prewitt", {}),
        ("roberts", {}),
        ("canny", {"threshold1": 50, "threshold2": 150}),
        ("otsu", {}),
        ("multi_otsu", {"classes": 3}),
        ("adaptive_thresh", {"block_size": 11, "c_val": 2}),
        ("kmeans", {"k": 3}),
        ("watershed", {}),
        ("fft", {}),
        ("freq_filter", {"filter_type": "gaussian_lowpass", "cutoff": 40}),
        ("add_noise", {"noise_type": "gaussian", "var": 0.01}),
        ("denoise_nlmeans", {"h": 10}),
        ("wiener", {"kernel_size": 3}),
        ("sampling_demo", {"factor": 2}),
        ("quantization_demo", {"levels": 4}),
        ("lbp", {"points": 8, "radius": 1.0})
    ]

    for op_name, params in test_ops:
        res = dip.apply_operation(sample_image_path, op_name, params)
        assert res.success is True, f"Operation {op_name} failed: {res.message}"
        assert res.output_image_url.startswith("/api/v1/processed/")
        assert res.stats_processed.width == 512
        assert res.mathematical_formula is not None
        assert res.academic_reference is not None

# =====================================================================
# 8. API Endpoints Integration Tests (TestClient)
# =====================================================================
def test_api_upload():
    # Create test image in memory
    img = np.full((64, 64, 3), 128, dtype=np.uint8)
    _, buffer = cv2.imencode(".png", img)
    file_bytes = BytesIO(buffer.tobytes())

    response = client.post(
        "/api/v1/image-processing/upload",
        files={"file": ("test_upload.png", file_bytes, "image/png")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "url" in data
    assert data["url"].startswith("/api/v1/uploads/")

def test_api_metadata(sample_image_path):
    response = client.post(
        "/api/v1/image-processing/metadata",
        data={"image_path": sample_image_path}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["width"] == 512
    assert data["height"] == 512
    assert "BGR" in data["color_model"] or "Multi-spectral" in data["color_model"]
    assert data["shannon_entropy"] > 0

def test_api_process(sample_image_path):
    response = client.post(
        "/api/v1/image-processing/process",
        data={
            "image_path": sample_image_path,
            "operation": "canny",
            "params_json": json.dumps({"threshold1": 60, "threshold2": 180})
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["operation"] == "canny"
    assert "output_image_url" in data
    assert "mathematical_formula" in data
    assert "academic_reference" in data

def test_api_quality(sample_image_path):
    response = client.post(
        "/api/v1/image-processing/quality",
        json={
            "reference_image_path": sample_image_path,
            "distorted_image_path": sample_image_path
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["psnr"] > 40.0
    assert data["ssim"] == pytest.approx(1.0, rel=1e-2)
    assert data["mse"] == pytest.approx(0.0, abs=1e-2)
    assert "interpretation" in data

def test_api_register(sample_image_path):
    response = client.post(
        "/api/v1/image-processing/register",
        json={
            "reference_image_path": sample_image_path,
            "moving_image_path": sample_image_path,
            "feature_type": "ORB"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["num_matches"] >= 4
    assert "registered_image_url" in data
    assert "difference_image_url" in data

def test_api_colorspace(sample_image_path):
    response = client.post(
        "/api/v1/image-processing/colorspace",
        data={"image_path": sample_image_path}
    )
    assert response.status_code == 200
    data = response.json()
    assert "rgb_url" in data
    assert "hsv_url" in data
    assert "lab_url" in data
    assert "ycrcb_url" in data
    assert len(data["color_models"]) >= 4

def test_api_sampling_quantization(sample_image_path):
    response = client.post(
        "/api/v1/image-processing/sampling-quantization",
        json={
            "image_path": sample_image_path,
            "sampling_factor": 4,
            "quantization_levels": 8
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "sampled_image_url" in data
    assert "quantized_image_url" in data
    assert data["sampling_metrics"]["sampling_factor"] == 4
    assert data["quantization_metrics"]["quantization_levels"] == 8

def test_api_texture(sample_image_path):
    response = client.post(
        "/api/v1/image-processing/texture",
        json={"image_path": sample_image_path}
    )
    assert response.status_code == 200
    data = response.json()
    assert "glcm_metrics" in data
    assert "glcm_contrast" in data["glcm_metrics"]
    assert "lbp_metrics" in data
    assert "lbp_map_url" in data
