import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
from app.core.config import settings
from app.core.security import validate_image_upload
from app.services.dip_service import dip_service
from app.models.schemas import (
    DIPProcessRequest,
    DIPProcessResponse,
    ImageQualityRequest,
    ImageQualityResponse,
    ImageRegistrationRequest,
    ImageRegistrationResponse
)

router = APIRouter()

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

@router.post("/process", response_model=DIPProcessResponse)
async def process_image(
    image_path: str = Form(...),
    operation: str = Form(...),
    params_json: Optional[str] = Form("{}")
):
    """
    Execute a Digital Image Processing algorithm.
    Supported: equalize, clahe, contrast_stretch, mean_filter, median_filter,
    gaussian_filter, sharpen, sobel, prewitt, roberts, canny, otsu, multi_otsu,
    adaptive_thresh, fft, kmeans_segmentation.
    """
    import json
    try:
        params = json.loads(params_json) if params_json else {}
    except Exception:
        params = {}

    # Handle relative or sample paths
    if not os.path.isabs(image_path):
        if image_path.startswith("/api/v1/uploads/"):
            image_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(image_path))
        elif image_path.startswith("/api/v1/processed/"):
            image_path = os.path.join(settings.PROCESSED_DIR, os.path.basename(image_path))
        elif image_path.startswith("sample:"):
            sample_name = image_path.split("sample:")[1]
            image_path = os.path.join(settings.SAMPLE_DATA_DIR, sample_name)
        else:
            image_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(image_path))

    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image file not found at path: {image_path}"
        )

    try:
        result = dip_service.apply_operation(image_path, operation, params)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DIP processing failed: {str(e)}"
        )

@router.post("/quality", response_model=ImageQualityResponse)
async def evaluate_quality(request: ImageQualityRequest):
    """Compute PSNR, SSIM, and MSE between reference and processed images."""
    ref_p = request.reference_image_path
    dist_p = request.distorted_image_path

    for p in [ref_p, dist_p]:
        if not os.path.exists(p):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File not found: {p}")

    try:
        return dip_service.evaluate_quality(ref_p, dist_p)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Quality evaluation error: {str(e)}")

@router.post("/register", response_model=ImageRegistrationResponse)
async def register_images(request: ImageRegistrationRequest):
    """Perform ORB-based feature alignment and Homography transformation."""
    ref_p = request.reference_image_path
    mov_p = request.moving_image_path

    for p in [ref_p, mov_p]:
        if not os.path.exists(p):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File not found: {p}")

    try:
        return dip_service.register_images(ref_p, mov_p, request.feature_type)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Registration failed: {str(e)}")
