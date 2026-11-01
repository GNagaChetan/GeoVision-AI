import math
from typing import Dict, Any, List, Tuple, Optional
from shapely.geometry import shape, mapping, Point, LineString, Polygon, MultiPolygon
from shapely.ops import transform
import pyproj
from app.services.gis.geometry import compute_compactness_ratio

class GeodesicEngine:
    """
    Computes rigorous geodesic measurements on the WGS84 Reference Ellipsoid
    (semi-major axis a = 6,378,137.0 m, flattening f = 1/298.257223563).
    """

    def __init__(self):
        self.geod = pyproj.Geod(ellps="WGS84")

    def calculate_polygon_metrics(self, geojson_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute true geodesic area (m2, ha, km2), perimeter (m, km), centroid, bbox, and compactness.
        """
        if geojson_data.get("type") == "FeatureCollection":
            features = geojson_data.get("features", [])
            if not features:
                raise ValueError("FeatureCollection contains no features.")
            geom_dict = features[0].get("geometry", {})
        elif geojson_data.get("type") == "Feature":
            geom_dict = geojson_data.get("geometry", {})
        else:
            geom_dict = geojson_data

        geom = shape(geom_dict)
        if not geom.is_valid:
            geom = geom.buffer(0)

        if isinstance(geom, (Polygon, MultiPolygon)):
            area_m2, perimeter_m = self.geod.geometry_area_perimeter(geom)
            area_m2 = abs(area_m2)
            perimeter_m = abs(perimeter_m)
        else:
            area_m2 = 0.0
            perimeter_m = self.geod.geometry_length(geom)

        area_ha = area_m2 / 10000.0
        area_km2 = area_m2 / 1000000.0
        perimeter_km = perimeter_m / 1000.0

        centroid = [round(geom.centroid.x, 6), round(geom.centroid.y, 6)]
        minx, miny, maxx, maxy = geom.bounds
        bbox = [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)]
        compactness = compute_compactness_ratio(area_m2, perimeter_m)

        return {
            "area_sq_meters": round(area_m2, 2),
            "area_hectares": round(area_ha, 4),
            "area_sq_km": round(area_km2, 4),
            "perimeter_meters": round(perimeter_m, 2),
            "perimeter_km": round(perimeter_km, 4),
            "centroid": centroid,
            "bounding_box": bbox,
            "compactness_score": compactness,
            "is_valid": geom.is_valid
        }

    def calculate_distance(self, coordinates: List[List[float]]) -> Dict[str, Any]:
        """
        Calculate geodesic distance along a sequence of [lon, lat] coordinates.
        """
        if len(coordinates) < 2:
            raise ValueError("Distance calculation requires at least 2 coordinate points.")

        total_distance_m = 0.0
        segments = []

        for i in range(len(coordinates) - 1):
            p1_lon, p1_lat = coordinates[i][0], coordinates[i][1]
            p2_lon, p2_lat = coordinates[i+1][0], coordinates[i+1][1]

            # Geod.inv returns forward azimuth, back azimuth, distance in meters
            fwd_az, back_az, seg_dist_m = self.geod.inv(p1_lon, p1_lat, p2_lon, p2_lat)
            seg_dist_m = abs(seg_dist_m)
            total_distance_m += seg_dist_m

            segments.append({
                "segment_index": i + 1,
                "from_point": [round(p1_lon, 6), round(p1_lat, 6)],
                "to_point": [round(p2_lon, 6), round(p2_lat, 6)],
                "distance_meters": round(seg_dist_m, 2),
                "distance_km": round(seg_dist_m / 1000.0, 4),
                "forward_azimuth_deg": round(fwd_az, 2),
                "back_azimuth_deg": round(back_az, 2)
            })

        total_distance_km = total_distance_m / 1000.0
        nautical_miles = total_distance_m / 1852.0

        return {
            "total_distance_meters": round(total_distance_m, 2),
            "total_distance_km": round(total_distance_km, 4),
            "total_distance_nautical_miles": round(nautical_miles, 4),
            "point_count": len(coordinates),
            "segments": segments
        }

    def create_geodesic_buffer(self, geojson_data: Dict[str, Any], distance_meters: float) -> Dict[str, Any]:
        """
        Generate geodesic buffer around geometry by dynamically projecting to optimal local UTM zone.
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
            geom = geom.buffer(0)

        # Centroid to find optimal UTM Zone
        cx, cy = geom.centroid.x, geom.centroid.y
        utm_zone = int((cx + 180) / 6) + 1
        is_northern = cy >= 0
        epsg_code = 32600 + utm_zone if is_northern else 32700 + utm_zone

        wgs84 = pyproj.CRS("EPSG:4326")
        utm_crs = pyproj.CRS(f"EPSG:{epsg_code}")

        project_to_utm = pyproj.Transformer.from_crs(wgs84, utm_crs, always_xy=True).transform
        project_to_wgs84 = pyproj.Transformer.from_crs(utm_crs, wgs84, always_xy=True).transform

        geom_utm = transform(project_to_utm, geom)
        buffered_utm = geom_utm.buffer(distance_meters)
        buffered_wgs84 = transform(project_to_wgs84, buffered_utm)

        orig_area_m2, _ = self.geod.geometry_area_perimeter(geom) if isinstance(geom, (Polygon, MultiPolygon)) else (0.0, 0.0)
        buff_area_m2, buff_perimeter_m = self.geod.geometry_area_perimeter(buffered_wgs84)

        orig_area_ha = abs(orig_area_m2) / 10000.0
        buff_area_ha = abs(buff_area_m2) / 10000.0
        expansion_ha = buff_area_ha - orig_area_ha

        buffered_geojson = {
            "type": "Feature",
            "geometry": mapping(buffered_wgs84),
            "properties": {
                "buffer_distance_m": distance_meters,
                "utm_zone_used": f"EPSG:{epsg_code}",
                "original_area_ha": round(orig_area_ha, 4),
                "buffered_area_ha": round(buff_area_ha, 4),
                "expansion_ha": round(expansion_ha, 4),
                "buffered_perimeter_m": round(abs(buff_perimeter_m), 2)
            }
        }

        return {
            "buffered_geojson": buffered_geojson,
            "original_area_ha": round(orig_area_ha, 4),
            "buffered_area_ha": round(buff_area_ha, 4),
            "expansion_ha": round(expansion_ha, 4),
            "distance_meters": distance_meters,
            "utm_projection": f"EPSG:{epsg_code}"
        }

geodesic_engine = GeodesicEngine()
