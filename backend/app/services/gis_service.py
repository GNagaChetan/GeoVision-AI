import json
import math
from typing import Dict, Any, List, Tuple
from shapely.geometry import shape, mapping, Polygon, MultiPolygon, Point
from shapely.ops import transform
import pyproj
from app.models.schemas import SpatialAreaResponse, SpatialBufferResponse

class GISService:
    """
    GIS & Vector Spatial Analytics Engine.
    Computes true geodesic areas, perimeters, centroids, and spatial buffer zones.
    """

    def __init__(self):
        # WGS84 Geod for accurate ellipsoidal calculations
        self.geod = pyproj.Geod(ellps="WGS84")

    def compute_polygon_metrics(self, geojson_data: Dict[str, Any]) -> SpatialAreaResponse:
        """
        Compute true geodesic area in sq. meters, hectares, and sq. km, plus centroid and bbox.
        """
        if geojson_data.get("type") == "FeatureCollection":
            features = geojson_data.get("features", [])
            if not features:
                raise ValueError("FeatureCollection is empty.")
            geom_dict = features[0].get("geometry", {})
        elif geojson_data.get("type") == "Feature":
            geom_dict = geojson_data.get("geometry", {})
        else:
            geom_dict = geojson_data

        geom = shape(geom_dict)
        if not geom.is_valid:
            geom = geom.buffer(0) # Attempt standard topology repair

        # Geodesic area & perimeter on WGS84 ellipsoid
        if isinstance(geom, (Polygon, MultiPolygon)):
            area_m2, perimeter_m = self.geod.geometry_area_perimeter(geom)
            area_m2 = abs(area_m2)
            perimeter_m = abs(perimeter_m)
        else:
            area_m2 = 0.0
            perimeter_m = self.geod.geometry_length(geom)

        area_ha = area_m2 / 10000.0
        area_km2 = area_m2 / 1000000.0

        centroid = [round(geom.centroid.x, 6), round(geom.centroid.y, 6)]
        minx, miny, maxx, maxy = geom.bounds
        bbox = [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)]

        return SpatialAreaResponse(
            area_sq_meters=round(area_m2, 2),
            area_hectares=round(area_ha, 4),
            area_sq_km=round(area_km2, 4),
            perimeter_meters=round(perimeter_m, 2),
            centroid=centroid,
            bounding_box=bbox,
            is_valid=geom.is_valid
        )

    def create_buffer(self, geojson_data: Dict[str, Any], distance_meters: float) -> SpatialBufferResponse:
        """
        Create geodesic buffer around a geometry by reprojecting to local UTM and back to WGS84.
        """
        if geojson_data.get("type") == "FeatureCollection":
            geom_dict = geojson_data["features"][0]["geometry"]
        elif geojson_data.get("type") == "Feature":
            geom_dict = geojson_data["geometry"]
        else:
            geom_dict = geojson_data

        geom = shape(geom_dict)
        # Compute centroid to determine optimal UTM zone
        cx, cy = geom.centroid.x, geom.centroid.y
        utm_zone = int((cx + 180) / 6) + 1
        is_northern = cy >= 0
        epsg_code = 32600 + utm_zone if is_northern else 32700 + utm_zone

        # Projections
        wgs84 = pyproj.CRS("EPSG:4326")
        utm_crs = pyproj.CRS(f"EPSG:{epsg_code}")

        project_to_utm = pyproj.Transformer.from_crs(wgs84, utm_crs, always_xy=True).transform
        project_to_wgs84 = pyproj.Transformer.from_crs(utm_crs, wgs84, always_xy=True).transform

        geom_utm = transform(project_to_utm, geom)
        buffered_utm = geom_utm.buffer(distance_meters)
        buffered_wgs84 = transform(project_to_wgs84, buffered_utm)

        orig_area_m2, _ = self.geod.geometry_area_perimeter(geom)
        buff_area_m2, _ = self.geod.geometry_area_perimeter(buffered_wgs84)

        buffered_geojson = {
            "type": "Feature",
            "geometry": mapping(buffered_wgs84),
            "properties": {
                "buffer_distance_m": distance_meters,
                "original_area_ha": round(abs(orig_area_m2) / 10000.0, 4),
                "buffered_area_ha": round(abs(buff_area_m2) / 10000.0, 4)
            }
        }

        return SpatialBufferResponse(
            buffered_geojson=buffered_geojson,
            original_area_ha=round(abs(orig_area_m2) / 10000.0, 4),
            buffered_area_ha=round(abs(buff_area_m2) / 10000.0, 4),
            distance_meters=distance_meters
        )

gis_service = GISService()
