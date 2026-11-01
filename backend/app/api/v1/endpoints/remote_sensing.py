import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Body
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.core.security import validate_image_upload
from app.services.remote_sensing import (
    rs_service,
    load_raster,
    validate_raster,
    extract_raster_metadata,
    inspect_bands,
    visualize_single_band,
    create_rgb_composite,
    create_false_color_composite,
    compute_spectral_index,
    create_study_area_project,
    list_study_area_projects
)
from app.models.schemas import (
    RasterMetadata,
    RasterValidationResponse,
    BandVisualizationRequest,
    BandVisualizationResponse,
    RGBCompositeRequest,
    RGBCompositeResponse,
    FalseColorCompositeRequest,
    FalseColorCompositeResponse,
    SpectralIndexRequest,
    SpectralIndexResponse,
    StudyAreaProject
)

router = APIRouter()

@router.get("/sample-scenes")
async def list_sample_scenes():
    """List available verified sample satellite scenes and spectral bands."""
    scenes = rs_service.get_sample_scenes()
    return {"scenes": scenes}

@router.post("/upload")
async def upload_raster(file: UploadFile = File(...)):
    """Upload a GeoTIFF or multispectral raster image."""
    clean_name = validate_image_upload(file)
    unique_name = f"{uuid.uuid4().hex[:8]}_{clean_name}"
    dest_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Perform initial validation
    val_res = validate_raster(dest_path)

    return {
        "success": True,
        "filename": unique_name,
        "file_path": dest_path,
        "url": f"/api/v1/uploads/{unique_name}",
        "validation": val_res
    }

@router.post("/validate", response_model=RasterValidationResponse)
async def validate_raster_endpoint(raster_path: str = Form(...)):
    """Validate raster integrity, dimensions, header decodability, and CRS."""
    res = validate_raster(raster_path)
    return RasterValidationResponse(**res)

@router.post("/metadata", response_model=RasterMetadata)
async def get_raster_metadata(raster_path: str = Form(...)):
    """
    Extract comprehensive spatial resolution, bounding box, geographic extent,
    CRS, sensor/platform information, and individual band statistics.
    """
    try:
        meta = extract_raster_metadata(raster_path)
        return RasterMetadata(**meta)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Raster metadata extraction failed: {str(e)}"
        )

@router.post("/bands/inspect")
async def inspect_bands_endpoint(raster_path: str = Form(...)):
    """Inspect all spectral bands with individual statistics, wavelengths, and preview thumbnails."""
    try:
        bands_list = inspect_bands(raster_path)
        return {"bands": bands_list, "total_bands": len(bands_list)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Band inspection failed: {str(e)}"
        )

@router.post("/bands/visualize", response_model=BandVisualizationResponse)
async def visualize_band_endpoint(request: BandVisualizationRequest):
    """Render a single band with custom colormaps (Viridis, Magma, Ocean, Summer, Hot, Grayscale)."""
    try:
        res = visualize_single_band(
            path=request.raster_path,
            band_index=request.band_index,
            colormap=request.colormap,
            percentile_min=request.percentile_min,
            percentile_max=request.percentile_max
        )
        return BandVisualizationResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Band visualization failed: {str(e)}"
        )

@router.post("/composite/rgb", response_model=RGBCompositeResponse)
async def make_rgb_composite_endpoint(request: RGBCompositeRequest):
    """Generate custom True-Color RGB composite from selectable band indices."""
    try:
        res = create_rgb_composite(
            path=request.raster_path,
            r_idx=request.r_band_idx,
            g_idx=request.g_band_idx,
            b_idx=request.b_band_idx,
            percentile_stretch=request.percentile_stretch
        )
        return RGBCompositeResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"RGB Composite creation failed: {str(e)}"
        )

@router.post("/composite/false-color", response_model=FalseColorCompositeResponse)
async def make_false_color_composite_endpoint(request: FalseColorCompositeRequest):
    """
    Generate False Color Composite (Color Infrared, Agriculture, Urban SWIR, Atmospheric Penetration).
    Strictly validates band existence and returns clear explanations if required bands are absent.
    """
    try:
        res = create_false_color_composite(
            path=request.raster_path,
            preset=request.preset,
            custom_r=request.r_band_idx,
            custom_g=request.g_band_idx,
            custom_b=request.b_band_idx
        )
        return FalseColorCompositeResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"False Color Composite creation failed: {str(e)}"
        )

@router.post("/spectral-index", response_model=SpectralIndexResponse)
async def compute_index_endpoint(
    index_type: str = "NDVI",
    raster_path: Optional[str] = None,
    nir_path: Optional[str] = None,
    red_path: Optional[str] = None,
    green_path: Optional[str] = None,
    swir_path: Optional[str] = None,
    nir_band_idx: Optional[int] = None,
    red_band_idx: Optional[int] = None,
    green_band_idx: Optional[int] = None,
    swir_band_idx: Optional[int] = None
):
    """
    Compute Normalized Difference Vegetation Index (NDVI), Water Index (NDWI),
    Built-up Index (NDBI), Soil-Adjusted Index (SAVI), or Enhanced Index (EVI).
    """
    # If unified raster_path is supplied
    if raster_path:
        try:
            res = compute_spectral_index(
                path=raster_path,
                index_type=index_type,
                nir_band_idx=nir_band_idx,
                red_band_idx=red_band_idx,
                green_band_idx=green_band_idx,
                swir_band_idx=swir_band_idx
            )
            return SpectralIndexResponse(**res)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Spectral index computation failed: {str(e)}"
            )

    # Legacy fallback for separate band paths
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
    """Legacy endpoint: Generate False Color Composite using default sample bands."""
    nir_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_nir.png")
    red_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_red.png")
    grn_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_green.png")

    try:
        _, fcc_url = rs_service.generate_false_color_composite(nir_p, red_p, grn_p, preset)
        return {
            "success": True,
            "fcc_url": fcc_url,
            "preset": preset,
            "description": "Standard False Color Composite (NIR -> Red, Red -> Green, Green -> Blue)"
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/study-area", response_model=StudyAreaProject)
async def create_study_area(
    project_name: str = Form(...),
    raster_path: str = Form(...),
    description: str = Form("")
):
    """Create a new Study Area analysis project linked to a spatial raster."""
    try:
        proj = create_study_area_project(
            project_name=project_name,
            raster_path=raster_path,
            description=description
        )
        return StudyAreaProject(**proj)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create study area project: {str(e)}"
        )

@router.get("/study-area/list", response_model=List[StudyAreaProject])
async def get_study_areas():
    """List active study area projects."""
    projects = list_study_area_projects()
    return [StudyAreaProject(**p) for p in projects]
