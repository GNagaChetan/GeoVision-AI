from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from app.services.change_detection_service import change_detection_service
from app.models.schemas import (
    ChangeDetectionValidationResponse,
    ChangeDetectionResponse
)

router = APIRouter()

@router.post("/validate", response_model=ChangeDetectionValidationResponse)
async def validate_scenes_compatibility(
    t1_raster_path: str = Query(...),
    t2_raster_path: str = Query(...)
):
    """
    Validate compatibility, CRS, spatial dimensions, and geographic overlap between Date A and Date B.
    """
    try:
        return change_detection_service.validate_change_scenes(t1_raster_path, t2_raster_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Scene validation error: {str(e)}"
        )

@router.post("/analyze", response_model=ChangeDetectionResponse)
async def analyze_multi_date_change(
    t1_raster_path: Optional[str] = Query(None),
    t2_raster_path: Optional[str] = Query(None),
    t1_name: str = Query("2020 (Baseline - T1)"),
    t2_name: str = Query("2025 (Recent - T2)"),
    resolution_m: float = Query(10.0)
):
    """
    Execute full multi-date change detection, generating difference maps,
    transition matrices, unchanged vs changed area metrics, and binary change masks.
    """
    try:
        return change_detection_service.compute_change_detection(
            t1_path=t1_raster_path,
            t2_path=t2_raster_path,
            t1_name=t1_name,
            t2_name=t2_name,
            pixel_res_meters=resolution_m
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Change detection error: {str(e)}"
        )
