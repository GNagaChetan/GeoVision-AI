import os
import shutil
import uuid
import json
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Body
from typing import Optional, Dict, Any, List

from app.core.config import settings
from app.core.security import validate_image_upload
from app.services.image_processing import (
    DIPService,
    load_image,
    extract_metadata,
    simulate_sampling,
    simulate_quantization,
    convert_color_spaces,
    glcm_texture_analysis,
    local_binary_patterns,
    compute_psnr,
    compute_ssim,
    compute_mse,
    interpret_quality_metrics,
    register_images as register_images_service
)
from app.models.schemas import (
    DIPProcessResponse,
    ImageMetadataResponse,
    ColorSpaceResponse,
    SamplingQuantizationRequest,
    SamplingQuantizationResponse,
    TextureAnalysisRequest,
    TextureAnalysisResponse,
    ImageQualityRequest,
    ImageQualityResponse,
    ImageRegistrationRequest,
    ImageRegistrationResponse
)

router = APIRouter()
dip_service = DIPService()

def _resolve_image_path(image_path: str) -> str:
    """Helper to resolve relative, upload, or sample paths."""
    if os.path.isabs(image_path) and os.path.exists(image_path):
        return image_path
    if image_path.startswith("/api/v1/uploads/"):
        return os.path.join(settings.UPLOAD_DIR, os.path.basename(image_path))
    if image_path.startswith("/api/v1/processed/"):
        return os.path.join(settings.PROCESSED_DIR, os.path.basename(image_path))
    if image_path.startswith("sample:"):
        sample_name = image_path.replace("sample:", "")
        return os.path.join(settings.SAMPLE_DATA_DIR, sample_name)

    sample_cand = os.path.join(settings.SAMPLE_DATA_DIR, os.path.basename(image_path))
    if os.path.exists(sample_cand):
        return sample_cand

    upload_cand = os.path.join(settings.UPLOAD_DIR, os.path.basename(image_path))
    if os.path.exists(upload_cand):
        return upload_cand

    return image_path

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file securely to the uploads directory."""
    clean_name = validate_image_upload(file)
    unique_name = f"{uuid.uuid4().hex[:8]}_{clean_name}"
    dest_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "success": True,
        "filename": unique_name,
        "file_path": dest_path,
        "url": f"/api/v1/uploads/{unique_name}"
    }

@router.post("/metadata", response_model=ImageMetadataResponse)
async def get_image_metadata(image_path: str = Form(...)):
    """Extract full image dimensions, aspect ratio, color model, bit depth, and statistical entropy."""
    resolved = _resolve_image_path(image_path)
    if not os.path.exists(resolved):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Image not found at path: {image_path}")

    try:
        img = load_image(resolved)
        meta = extract_metadata(img, path=image_path)
        return ImageMetadataResponse(**meta)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Metadata extraction failed: {str(e)}")

@router.post("/colorspace", response_model=ColorSpaceResponse)
async def convert_colorspace(image_path: str = Form(...)):
    """Convert input image into RGB, HSV, LAB, and YCrCb/YCbCr color representations."""
    resolved = _resolve_image_path(image_path)
    if not os.path.exists(resolved):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Image not found at path: {image_path}")

    try:
        img = load_image(resolved)
        spaces = convert_color_spaces(img)

        _, bgr_url = dip_service.save_processed_image(spaces["bgr"], prefix="bgr")
        _, rgb_url = dip_service.save_processed_image(cv2.cvtColor(spaces["rgb"], cv2.COLOR_RGB2BGR), prefix="rgb")
        _, hsv_url = dip_service.save_processed_image(spaces["hsv"], prefix="hsv")
        _, lab_url = dip_service.save_processed_image(spaces["lab"], prefix="lab")
        _, ycrcb_url = dip_service.save_processed_image(spaces["ycrcb"], prefix="ycrcb")

        return ColorSpaceResponse(
            bgr_url=bgr_url,
            rgb_url=rgb_url,
            hsv_url=hsv_url,
            lab_url=lab_url,
            ycrcb_url=ycrcb_url,
            color_models=["BGR (Native OpenCV)", "RGB (Standard Trichromatic)", "HSV (Hue Saturation Value)", "CIE LAB (Perceptually Uniform)", "YCrCb (Luminance Chrominance)"]
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Colorspace conversion failed: {str(e)}")

@router.post("/sampling-quantization", response_model=SamplingQuantizationResponse)
async def sampling_quantization_demo(request: SamplingQuantizationRequest):
    """Demonstrate spatial sampling reduction and gray-level quantization degradation."""
    resolved = _resolve_image_path(request.image_path)
    if not os.path.exists(resolved):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Image not found at path: {request.image_path}")

    try:
        img = load_image(resolved)
        sampled_img, s_metrics = simulate_sampling(img, factor=request.sampling_factor)
        quant_img, q_metrics = simulate_quantization(img, levels=request.quantization_levels)

        _, sampled_url = dip_service.save_processed_image(sampled_img, prefix="sample_down")
        _, quant_url = dip_service.save_processed_image(quant_img, prefix="quant_down")

        return SamplingQuantizationResponse(
            sampled_image_url=sampled_url,
            quantized_image_url=quant_url,
            sampling_metrics=s_metrics,
            quantization_metrics=q_metrics
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Sampling/Quantization demo failed: {str(e)}")

@router.post("/texture", response_model=TextureAnalysisResponse)
async def analyze_texture(request: TextureAnalysisRequest):
    """Extract GLCM Haralick texture descriptors and Local Binary Patterns (LBP)."""
    resolved = _resolve_image_path(request.image_path)
    if not os.path.exists(resolved):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Image not found at path: {request.image_path}")

    try:
        img = load_image(resolved)
        glcm_res = glcm_texture_analysis(img)
        lbp_map, lbp_metrics = local_binary_patterns(img)
        _, lbp_url = dip_service.save_processed_image(lbp_map, prefix="lbp")

        return TextureAnalysisResponse(
            glcm_metrics=glcm_res,
            lbp_metrics=lbp_metrics,
            lbp_map_url=lbp_url
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Texture analysis failed: {str(e)}")

@router.post("/process", response_model=DIPProcessResponse)
async def process_image(
    image_path: str = Form(...),
    operation: str = Form(...),
    params_json: Optional[str] = Form("{}")
):
    """
    Execute a Digital Image Processing algorithm.
    Supported: equalize, clahe, contrast_stretch, gamma_correction, log_transform,
    mean_filter, median_filter, gaussian_filter, sharpen, sobel, prewitt, roberts,
    canny, otsu, adaptive_thresh, multi_otsu, kmeans, watershed, fft, freq_filter,
    add_noise, denoise_nlmeans, wiener, inpaint, sampling_demo, quantization_demo, lbp.
    """
    try:
        params = json.loads(params_json) if params_json else {}
    except Exception:
        params = {}

    resolved = _resolve_image_path(image_path)
    if not os.path.exists(resolved):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image file not found at path: {image_path}"
        )

    try:
        result = dip_service.apply_operation(resolved, operation, params)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DIP processing failed: {str(e)}"
        )

@router.post("/quality", response_model=ImageQualityResponse)
async def evaluate_quality(request: ImageQualityRequest):
    """
    Compute verified Peak Signal-to-Noise Ratio (PSNR in dB), Structural Similarity (SSIM),
    and Mean Squared Error (MSE) between reference and processed scenes.
    """
    ref_p = _resolve_image_path(request.reference_image_path)
    dist_p = _resolve_image_path(request.distorted_image_path)

    for p in [ref_p, dist_p]:
        if not os.path.exists(p):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File not found: {p}")

    try:
        ref_img = load_image(ref_p)
        dist_img = load_image(dist_p)

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
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Quality evaluation error: {str(e)}")

@router.post("/register", response_model=ImageRegistrationResponse)
async def register_images(request: ImageRegistrationRequest):
    """Perform sub-pixel feature alignment (ORB/SIFT/AKAZE) and RANSAC Homography transformation."""
    ref_p = _resolve_image_path(request.reference_image_path)
    mov_p = _resolve_image_path(request.moving_image_path)

    for p in [ref_p, mov_p]:
        if not os.path.exists(p):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File not found: {p}")

    try:
        ref_img = load_image(ref_p)
        mov_img = load_image(mov_p)

        res = register_images_service(ref_img, mov_img, feature_type=request.feature_type)
        _, reg_url = dip_service.save_processed_image(res["registered_image"], prefix="reg")
        _, diff_url = dip_service.save_processed_image(res["difference_image"], prefix="diff")

        return ImageRegistrationResponse(
            success=res["success"],
            num_matches=res["num_matches"],
            homography_matrix=res["homography_matrix"],
            registered_image_url=reg_url,
            difference_image_url=diff_url,
            alignment_error=res["alignment_error"],
            message=res.get("message")
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Registration failed: {str(e)}")
