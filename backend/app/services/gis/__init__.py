from typing import Dict, Any, List, Optional
from app.services.gis.geometry import (
    validate_geojson_geometry,
    extract_features_and_geometries,
    compute_compactness_ratio
)
from app.services.gis.geodesic import geodesic_engine, GeodesicEngine
from app.services.gis.spatial_queries import spatial_query_engine, SpatialQueryEngine
from app.services.gis.raster_gis import raster_gis_engine, RasterGISEngine
from app.services.gis.crs_engine import crs_engine, CRSEngine
from app.services.gis.layer_manager import layer_manager, LayerManager
from app.services.gis.study_area_manager import study_area_manager, StudyAreaManager
from app.models.schemas import SpatialAreaResponse, SpatialBufferResponse

class GISService:
    """
    Unified GIS & Vector Spatial Analytics Engine.
    Combines Geodesic measurements, PostGIS / spatial indexing, layer management,
    CRS transformations, and Rasterio metadata extraction.
    """

    def __init__(self):
        self.geodesic = geodesic_engine
        self.spatial = spatial_query_engine
        self.raster = raster_gis_engine
        self.crs = crs_engine
        self.layers = layer_manager
        self.study_areas = study_area_manager

    # Backward compatibility with existing methods
    def compute_polygon_metrics(self, geojson_data: Dict[str, Any]) -> SpatialAreaResponse:
        metrics = self.geodesic.calculate_polygon_metrics(geojson_data)
        return SpatialAreaResponse(
            area_sq_meters=metrics["area_sq_meters"],
            area_hectares=metrics["area_hectares"],
            area_sq_km=metrics["area_sq_km"],
            perimeter_meters=metrics["perimeter_meters"],
            centroid=metrics["centroid"],
            bounding_box=metrics["bounding_box"],
            is_valid=metrics["is_valid"]
        )

    def create_buffer(self, geojson_data: Dict[str, Any], distance_meters: float) -> SpatialBufferResponse:
        res = self.geodesic.create_geodesic_buffer(geojson_data, distance_meters)
        return SpatialBufferResponse(
            buffered_geojson=res["buffered_geojson"],
            original_area_ha=res["original_area_ha"],
            buffered_area_ha=res["buffered_area_ha"],
            distance_meters=res["distance_meters"]
        )

    def list_study_areas(self) -> List[Dict[str, Any]]:
        return self.study_areas.list_study_areas()

    def list_layers(self) -> List[Dict[str, Any]]:
        return self.layers.list_vector_layers()

    def get_sample_study_area_geojson(self) -> Dict[str, Any]:
        study_areas = self.study_areas.list_study_areas()
        if study_areas and "boundary_geojson" in study_areas[0]:
            return study_areas[0]["boundary_geojson"]
        import os, json
        from app.core.config import settings
        sample_path = os.path.join(settings.SAMPLE_DATA_DIR, "study_area_boundary.geojson")
        if os.path.exists(sample_path):
            with open(sample_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"type": "FeatureCollection", "features": []}

gis_service = GISService()
