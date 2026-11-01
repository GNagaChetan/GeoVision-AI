"""
Remote Sensing Service backward-compatible facade routing directly to app.services.remote_sensing.
"""
from app.services.remote_sensing import (
    RemoteSensingService,
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
    list_study_area_projects,
    get_study_area_project,
    BaseSatelliteProvider,
    LocalArchiveSatelliteProvider
)

__all__ = [
    "RemoteSensingService",
    "rs_service",
    "load_raster",
    "validate_raster",
    "extract_raster_metadata",
    "inspect_bands",
    "visualize_single_band",
    "create_rgb_composite",
    "create_false_color_composite",
    "compute_spectral_index",
    "create_study_area_project",
    "list_study_area_projects",
    "get_study_area_project",
    "BaseSatelliteProvider",
    "LocalArchiveSatelliteProvider"
]
