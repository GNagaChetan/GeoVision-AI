import os
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from app.core.config import settings
from .metadata import extract_raster_metadata
from .raster_io import resolve_raster_path

_STUDY_AREA_PROJECTS: Dict[str, Dict[str, Any]] = {}

def create_study_area_project(
    project_name: str,
    raster_path: str,
    description: str = "",
    study_area_geojson: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Creates a new study area project linked to a spatial raster and bounding geometry.
    """
    project_id = f"proj_{uuid.uuid4().hex[:8]}"
    resolved = resolve_raster_path(raster_path)
    meta = extract_raster_metadata(resolved)

    # Use raster's geographic extent if custom GeoJSON is not provided
    geo_geom = study_area_geojson or meta.get("geographic_extent")

    # Compute rough area in hectares from WGS84 bounding box or spatial resolution
    w, h = meta["width"], meta["height"]
    res_x, res_y = meta["spatial_resolution"]
    if meta.get("is_projected"):
        area_sq_m = (w * res_x) * (h * res_y)
    else:
        # Approximate 1 degree ~ 111,320m
        area_sq_m = (w * res_x * 111320.0) * (h * res_y * 111320.0)
    area_ha = round(area_sq_m / 10000.0, 2)

    project_data = {
        "project_id": project_id,
        "project_name": project_name,
        "description": description or f"Geospatial study area for {os.path.basename(resolved)}",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "raster_path": raster_path,
        "study_area_geojson": geo_geom,
        "area_hectares": area_ha,
        "metadata": meta
    }

    _STUDY_AREA_PROJECTS[project_id] = project_data
    return project_data

def list_study_area_projects() -> List[Dict[str, Any]]:
    """Lists all active study area analysis projects."""
    if not _STUDY_AREA_PROJECTS:
        # Initialize with default sample project
        try:
            sample_p = os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif")
            if not os.path.exists(sample_p):
                sample_p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
            create_study_area_project(
                project_name="Delhi NCR Sentinel-2 Study Area",
                raster_path=sample_p,
                description="Verified 10m Ground Sample Distance Multispectral Baseline Project"
            )
        except Exception:
            pass

    return list(_STUDY_AREA_PROJECTS.values())

def get_study_area_project(project_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves project by ID."""
    return _STUDY_AREA_PROJECTS.get(project_id)
