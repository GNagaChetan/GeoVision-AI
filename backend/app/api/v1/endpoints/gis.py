import os
import json
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from app.core.config import settings
from app.core.security import validate_geojson_structure
from app.services.gis_service import gis_service
from app.models.schemas import (
    SpatialAreaRequest,
    SpatialAreaResponse,
    SpatialBufferRequest,
    SpatialBufferResponse
)

router = APIRouter()

@router.get("/sample-study-area")
async def get_sample_study_area():
    """Retrieve verified GeoJSON polygon for the study area boundary."""
    geojson_path = os.path.join(settings.SAMPLE_DATA_DIR, "study_area_boundary.geojson")
    if not os.path.exists(geojson_path):
        raise HTTPException(status_code=404, detail="Sample study area GeoJSON not generated yet.")
    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@router.post("/area-metrics", response_model=SpatialAreaResponse)
async def compute_area(request: SpatialAreaRequest):
    """Compute true geodesic area in sq meters, hectares, and sq km with perimeter & centroid."""
    if not validate_geojson_structure(request.geojson):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid GeoJSON geometry structure.")

    try:
        return gis_service.compute_polygon_metrics(request.geojson)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Area computation error: {str(e)}")

@router.post("/buffer", response_model=SpatialBufferResponse)
async def create_buffer_zone(request: SpatialBufferRequest):
    """Generate geodesic spatial buffer polygon in GeoJSON."""
    if not validate_geojson_structure(request.geojson):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid GeoJSON geometry structure.")

    if request.distance_meters <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Buffer distance must be positive.")

    try:
        return gis_service.create_buffer(request.geojson, request.distance_meters)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Buffer generation error: {str(e)}")
