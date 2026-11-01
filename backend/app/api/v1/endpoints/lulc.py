import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Response, status
from typing import Optional, List
from app.core.config import settings
from app.services.lulc_service import lulc_service
from app.services.remote_sensing.raster_io import resolve_raster_path
from app.models.schemas import (
    LULCClassificationResponse,
    LULCValidationResponse,
    LULCClassifyRequest
)

router = APIRouter()

@router.post("/validate", response_model=LULCValidationResponse)
async def validate_lulc_input(raster_path: str = Form(...)):
    """Validate raster file dimensions, format, and class values for LULC analysis."""
    resolved = resolve_raster_path(raster_path)
    try:
        return lulc_service.validate_lulc_raster(resolved)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Validation error: {str(e)}")

@router.post("/classify", response_model=LULCClassificationResponse)
async def classify_scene(
    scene_id: Optional[str] = Query(None),
    raster_path: Optional[str] = Query(None),
    resolution_m: float = Query(10.0)
):
    """
    Execute 5-class LULC classification (Vegetation, Water, Built-up, Agriculture, Bare Land)
    and compute exact pixel counts, hectare areas, percentages, and dominant class.
    """
    is_demo = False
    if raster_path and os.path.exists(resolve_raster_path(raster_path)):
        img_path = resolve_raster_path(raster_path)
        name = os.path.basename(img_path)
    elif scene_id in ["scene_2020", "t1"]:
        img_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
        name = "Study Area Scene (2020 Baseline)"
        is_demo = True
    elif scene_id in ["scene_2025", "t2"]:
        img_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2025_t2.png")
        name = "Study Area Scene (2025 Recent)"
        is_demo = True
    else:
        img_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
        name = "Sample Study Scene"
        is_demo = True

    try:
        return lulc_service.process_dataset_lulc(img_path, dataset_name=name, res_m=resolution_m, is_demo=is_demo)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"LULC classification error: {str(e)}"
        )

@router.get("/export/csv")
async def export_lulc_csv(scene_id: str = "scene_2020", resolution_m: float = 10.0):
    """Export LULC class statistics as downloadable CSV."""
    img_path = os.path.join(settings.SAMPLE_DATA_DIR, f"{scene_id}_t1.png" if "2020" in scene_id else "scene_2025_t2.png")
    if not os.path.exists(img_path):
        img_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")

    res = lulc_service.process_dataset_lulc(img_path, res_m=resolution_m)
    csv_str = lulc_service.export_statistics_csv(res.classes)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=lulc_statistics_{scene_id}.csv"}
    )
