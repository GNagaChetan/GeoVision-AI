import numpy as np
from typing import Dict, Any, List, Optional
from shapely.geometry import shape, mapping, Point, Polygon, MultiPolygon, box
from shapely.strtree import STRtree
import pyproj
from app.services.gis.geometry import extract_features_and_geometries, compute_compactness_ratio

class SpatialQueryEngine:
    """
    High-performance vector spatial indexing, point-in-polygon querying,
    bounding box filters, and polygon descriptive statistics.
    """

    def __init__(self):
        self.geod = pyproj.Geod(ellps="WGS84")

    def point_in_polygon_query(
        self,
        point_lon: float,
        point_lat: float,
        features_or_geojson: Any
    ) -> List[Dict[str, Any]]:
        """
        Find all features whose geometry contains the given point coordinate [lon, lat].
        """
        pt = Point(point_lon, point_lat)
        feature_tuples = extract_features_and_geometries(features_or_geojson)
        matches = []

        for geom, props, feat_id in feature_tuples:
            if geom.contains(pt) or geom.touches(pt):
                # Calculate feature area if polygon
                area_ha = 0.0
                if isinstance(geom, (Polygon, MultiPolygon)):
                    area_m2, _ = self.geod.geometry_area_perimeter(geom)
                    area_ha = round(abs(area_m2) / 10000.0, 4)

                centroid = [round(geom.centroid.x, 6), round(geom.centroid.y, 6)]
                minx, miny, maxx, maxy = geom.bounds

                matches.append({
                    "feature_id": feat_id,
                    "properties": props,
                    "geometry_type": geom.geom_type,
                    "area_hectares": area_ha,
                    "centroid": centroid,
                    "bounds": [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)],
                    "contains_point": True
                })

        return matches

    def query_bounding_box(
        self,
        bbox: List[float],
        features_or_geojson: Any,
        predicate: str = "intersects"
    ) -> Dict[str, Any]:
        """
        Perform spatial query against bounding box [minx, miny, maxx, maxy].
        predicate: 'intersects', 'within', 'contains'
        """
        if len(bbox) != 4:
            raise ValueError("Bounding box must contain exactly 4 numbers [minx, miny, maxx, maxy].")

        minx, miny, maxx, maxy = bbox
        bbox_geom = box(minx, miny, maxx, maxy)

        feature_tuples = extract_features_and_geometries(features_or_geojson)
        matched_features = []

        for geom, props, feat_id in feature_tuples:
            match = False
            if predicate == "intersects" and bbox_geom.intersects(geom):
                match = True
            elif predicate == "within" and bbox_geom.contains(geom):
                match = True
            elif predicate == "contains" and geom.contains(bbox_geom):
                match = True

            if match:
                matched_features.append({
                    "type": "Feature",
                    "id": feat_id,
                    "properties": props,
                    "geometry": mapping(geom)
                })

        return {
            "bbox_queried": bbox,
            "predicate": predicate,
            "matched_count": len(matched_features),
            "total_queried": len(feature_tuples),
            "result_geojson": {
                "type": "FeatureCollection",
                "features": matched_features
            }
        }

    def filter_by_spatial_relationship(
        self,
        target_geojson: Dict[str, Any],
        reference_geojson: Dict[str, Any],
        predicate: str = "intersects"
    ) -> Dict[str, Any]:
        """
        Filter features from target_geojson based on spatial relationship to reference_geojson.
        Supported predicates: 'intersects', 'contains', 'within', 'touches', 'disjoint'
        """
        ref_tuples = extract_features_and_geometries(reference_geojson)
        if not ref_tuples:
            raise ValueError("Reference GeoJSON contains no valid geometries.")
        ref_geom = ref_tuples[0][0] # Primary reference geometry

        target_tuples = extract_features_and_geometries(target_geojson)
        filtered_features = []

        for geom, props, feat_id in target_tuples:
            matched = False
            if predicate == "intersects" and ref_geom.intersects(geom):
                matched = True
            elif predicate == "contains" and ref_geom.contains(geom):
                matched = True
            elif predicate == "within" and geom.within(ref_geom):
                matched = True
            elif predicate == "touches" and ref_geom.touches(geom):
                matched = True
            elif predicate == "disjoint" and ref_geom.disjoint(geom):
                matched = True

            if matched:
                filtered_features.append({
                    "type": "Feature",
                    "id": feat_id,
                    "properties": props,
                    "geometry": mapping(geom)
                })

        return {
            "predicate_applied": predicate,
            "matched_count": len(filtered_features),
            "total_source_features": len(target_tuples),
            "filtered_geojson": {
                "type": "FeatureCollection",
                "features": filtered_features
            }
        }

    def calculate_polygon_dataset_statistics(self, geojson_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute descriptive spatial statistics across all polygons in a GeoJSON dataset.
        """
        feature_tuples = extract_features_and_geometries(geojson_data)
        if not feature_tuples:
            raise ValueError("No features available for statistical calculation.")

        areas_ha = []
        perimeters_m = []
        vertex_counts = []
        compactness_scores = []
        bounds_all = []

        for geom, props, _ in feature_tuples:
            if isinstance(geom, (Polygon, MultiPolygon)):
                area_m2, perim_m = self.geod.geometry_area_perimeter(geom)
                area_m2 = abs(area_m2)
                perim_m = abs(perim_m)
                area_ha = area_m2 / 10000.0
                areas_ha.append(area_ha)
                perimeters_m.append(perim_m)
                compactness_scores.append(compute_compactness_ratio(area_m2, perim_m))

            # Count vertices
            if hasattr(geom, "exterior") and geom.exterior:
                v_count = len(geom.exterior.coords)
                if hasattr(geom, "interiors"):
                    for interior in geom.interiors:
                        v_count += len(interior.coords)
                vertex_counts.append(v_count)
            elif hasattr(geom, "geoms"):
                total_v = sum(len(g.exterior.coords) for g in geom.geoms if hasattr(g, "exterior"))
                vertex_counts.append(total_v)

            bounds_all.append(geom.bounds)

        if not areas_ha:
            return {
                "feature_count": len(feature_tuples),
                "polygon_count": 0,
                "message": "No Polygon or MultiPolygon geometries found in dataset."
            }

        areas_arr = np.array(areas_ha)
        perims_arr = np.array(perimeters_m)
        vertices_arr = np.array(vertex_counts) if vertex_counts else np.array([0])
        compactness_arr = np.array(compactness_scores)

        # Global bounding box covering all features
        all_minx = min(b[0] for b in bounds_all)
        all_miny = min(b[1] for b in bounds_all)
        all_maxx = max(b[2] for b in bounds_all)
        all_maxy = max(b[3] for b in bounds_all)

        return {
            "total_features": len(feature_tuples),
            "polygon_count": len(areas_ha),
            "total_area_hectares": round(float(np.sum(areas_arr)), 4),
            "total_area_sq_km": round(float(np.sum(areas_arr)) / 100.0, 4),
            "mean_area_ha": round(float(np.mean(areas_arr)), 4),
            "median_area_ha": round(float(np.median(areas_arr)), 4),
            "min_area_ha": round(float(np.min(areas_arr)), 4),
            "max_area_ha": round(float(np.max(areas_arr)), 4),
            "std_dev_area_ha": round(float(np.std(areas_arr)), 4),
            "total_perimeter_km": round(float(np.sum(perims_arr)) / 1000.0, 4),
            "mean_perimeter_m": round(float(np.mean(perims_arr)), 2),
            "mean_compactness_score": round(float(np.mean(compactness_arr)), 4),
            "total_vertices": int(np.sum(vertices_arr)),
            "mean_vertices_per_polygon": round(float(np.mean(vertices_arr)), 1),
            "dataset_bounding_box": [
                round(all_minx, 6),
                round(all_miny, 6),
                round(all_maxx, 6),
                round(all_maxy, 6)
            ]
        }

spatial_query_engine = SpatialQueryEngine()
