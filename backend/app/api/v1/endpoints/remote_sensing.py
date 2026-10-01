import os
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.rs_service import rs_service
from app.models.schemas import SpectralIndexResponse, RasterMetadata

router = APIRouter()

@router.get("/sample-scenes")
async def list_sample_scenes():
    """List available verified sample satellite scenes and spectral bands."""
    scenes = [
        {
            "id": "scene_2020",
            "name": "GeoVision Study Area Scene (2020 - T1)",
            "sensor": "Sentinel-2 MSI",
            "spatial_resolution": "10 meters",
            "acquisition_date": "2020-03-15",
            "rgb_url": "/api/v1/samples/scene_2020_t1.png",
            "file_path": os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png"),
            "crs": "EPSG:4326",
            "bands_available": ["Red", "Green", "Blue", "NIR", "SWIR"],
            "is_sample_data": True
        },
        {
            "id": "scene_2025",
            "name": "GeoVision Study Area Scene (2025 - T2)",
            "sensor": "Sentinel-2 MSI",
            "spatial_resolution": "10 meters",
            "acquisition_date": "2025-03-18",
            "rgb_url": "/api/v1/samples/scene_2025_t2.png",
            "file_path": os.path.join(settings.SAMPLE_DATA_DIR, "scene_2025_t2.png"),
            "crs": "EPSG:4326",
            "bands_available": ["Red", "Green", "Blue", "NIR", "SWIR"],
            "is_sample_data": True
        }
    ]
    return {"scenes": scenes}

@router.post("/spectral-index", response_model=SpectralIndexResponse)
async def compute_index(
    index_type: str = "NDVI",
    nir_path: Optional[str] = None,
    red_path: Optional[str] = None,
    green_path: Optional[str] = None,
    swir_path: Optional[str] = None
):
    """
    Compute Normalized Difference Vegetation Index (NDVI),
    Water Index (NDWI), or Built-up Index (NDBI).
    """
    # Use default sample bands if not explicitly provided
    if not nir_path:
        nir_path = os.path.join(settings.SAMPLE_DATA_DIR, "band_nir.png")
    if not red_path:
        red_path = os.path.join(settings.SAMPLE_DATA_DIR, "band_red.png")
    if not green_path:
        green_path = os.path.join(settings.SAMPLE_DATA_DIR, "band_green.png")
    if not swir_path:
        swir_path = os.path.join(settings.SAMPLE_DATA_DIR, "band_swir.png")

    try:
        res = rs_service.process_multispectral_scene(
            nir_path=nir_path,
            red_path=red_path,
            green_path=green_path,
            swir_path=swir_path,
            index_type=index_type
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Spectral index computation failed: {str(e)}"
        )

@router.post("/false-color")
async def generate_fcc(preset: str = "Standard_FCC"):
    """Generate False Color Composite (Standard NIR-Red-Green)."""
    nir_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_nir.png")
    red_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_red.png")
    grn_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_green.png")

    try:
        _, fcc_url = rs_service.generate_false_color_composite(nir_p, red_p, grn_p, preset)
        return {
            "success": True,
            "fcc_url": fcc_url,
            "preset": preset,
            "description": "Standard False Color Composite (NIR -> Red channel, Red -> Green channel, Green -> Blue channel)"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
