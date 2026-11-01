from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from app.services.vegetation_service import vegetation_service
from app.models.schemas import (
    NDVIAnalysisResponse,
    NDVIAnalysisRequest
)

router = APIRouter()

@router.post("/ndvi", response_model=NDVIAnalysisResponse)
async def compute_ndvi(
    raster_path: Optional[str] = Query(None),
    red_band_idx: Optional[int] = Query(None),
    nir_band_idx: Optional[int] = Query(None),
    colormap: str = Query("RdYlGn"),
    resolution_m: float = Query(10.0)
):
    """
    Compute rigorous NDVI: (NIR - Red) / (NIR + Red) with explicit band verification,
    safe division-by-zero protection, 4-tier threshold distribution, and statistical moments.
    """
    try:
        return vegetation_service.calculate_ndvi(
            raster_path=raster_path,
            red_band_idx=red_band_idx,
            nir_band_idx=nir_band_idx,
            colormap=colormap,
            pixel_res_meters=resolution_m
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"NDVI processing error: {str(e)}"
        )
