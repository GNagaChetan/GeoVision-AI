import os
from fastapi import APIRouter, HTTPException, status
from typing import Optional
from app.core.config import settings
from app.services.lulc_service import lulc_service
from app.models.schemas import (
    LULCClassificationResponse,
    LULCTemporalComparisonResponse
)

router = APIRouter()

@router.post("/classify", response_model=LULCClassificationResponse)
async def classify_scene(
    scene_id: str = "scene_2020",
    resolution_m: float = 10.0
):
    """
    Execute 5-class LULC classification (Vegetation, Water, Built-up, Agriculture, Bare Land)
    and compute exact pixel counts, hectare areas, and percentages.
    """
    if scene_id in ["scene_2020", "t1"]:
        img_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
        name = "Study Area Scene (2020)"
    elif scene_id in ["scene_2025", "t2"]:
        img_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2025_t2.png")
        name = "Study Area Scene (2025)"
    elif os.path.exists(scene_id):
        img_path = scene_id
        name = os.path.basename(scene_id)
    else:
        img_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
        name = "Default Study Scene"

    try:
        return lulc_service.process_dataset_lulc(img_path, dataset_name=name, res_m=resolution_m)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"LULC classification error: {str(e)}"
        )

@router.post("/temporal-change", response_model=LULCTemporalComparisonResponse)
async def analyze_temporal_change(resolution_m: float = 10.0):
    """
    Execute pixel-accurate multi-temporal change detection and compute NxN transition matrix (T1 -> T2).
    """
    t1_p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
    t2_p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2025_t2.png")

    try:
        return lulc_service.compare_temporal_scenes(
            t1_path=t1_p,
            t2_path=t2_p,
            t1_name="2020 (T1 - Baseline)",
            t2_name="2025 (T2 - Recent)",
            res_m=resolution_m
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Temporal change calculation error: {str(e)}"
        )
