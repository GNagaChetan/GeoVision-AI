import math
from typing import Dict, Any, List, Tuple, Optional
from shapely.geometry import shape, mapping, Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
from shapely.validation import explain_validity, make_valid
from shapely.ops import unary_union

def validate_geojson_geometry(geojson_data: Dict[str, Any]) -> Tuple[bool, List[str], Optional[Dict[str, Any]], Dict[str, Any]]:
    """
    Validate GeoJSON geometry structure and topology.
    Returns:
        is_valid: bool
        issues: List[str]
        repaired_geojson: Optional[dict]
        details: Dict[str, Any]
    """
    issues: List[str] = []
    
    if not isinstance(geojson_data, dict):
        return False, ["Input is not a valid JSON dictionary."], None, {}

    # Extract geometry object
    geom_type = geojson_data.get("type")
    if not geom_type:
        return False, ["Missing 'type' field in GeoJSON."], None, {}

    features_list = []
    if geom_type == "FeatureCollection":
        features = geojson_data.get("features", [])
        if not isinstance(features, list):
            return False, ["'features' must be a list in FeatureCollection."], None, {}
        if len(features) == 0:
            return False, ["FeatureCollection is empty."], None, {}
        features_list = features
    elif geom_type == "Feature":
        if "geometry" not in geojson_data or not geojson_data["geometry"]:
            return False, ["Feature is missing a 'geometry' object."], None, {}
        features_list = [geojson_data]
    else:
        # Bare geometry
        features_list = [{"type": "Feature", "geometry": geojson_data, "properties": {}}]

    all_valid = True
    total_vertices = 0
    geom_types_found = set()
    repaired_features = []

    for idx, feat in enumerate(features_list):
        g_dict = feat.get("geometry")
        if not g_dict or not isinstance(g_dict, dict):
            issues.append(f"Feature[{idx}] has null or non-dictionary geometry.")
            all_valid = False
            continue

        g_type = g_dict.get("type")
        geom_types_found.add(g_type)
        coords = g_dict.get("coordinates")

        if coords is None:
            issues.append(f"Feature[{idx}] has missing 'coordinates'.")
            all_valid = False
            continue

        # Check coordinate bounds (WGS84 lat [-90, 90], lon [-180, 180])
        def check_coords_bounds(c_list):
            nonlocal total_vertices
            if isinstance(c_list, (int, float)):
                return
            if len(c_list) >= 2 and isinstance(c_list[0], (int, float)) and isinstance(c_list[1], (int, float)):
                total_vertices += 1
                lon, lat = c_list[0], c_list[1]
                if not (-180.0 <= lon <= 180.0):
                    issues.append(f"Feature[{idx}]: Longitude {lon} out of WGS84 range [-180, 180].")
                if not (-90.0 <= lat <= 90.0):
                    issues.append(f"Feature[{idx}]: Latitude {lat} out of WGS84 range [-90, 90].")
            else:
                for sub in c_list:
                    if isinstance(sub, list):
                        check_coords_bounds(sub)

        check_coords_bounds(coords)

        # Polygon ring closure check
        if g_type == "Polygon" and isinstance(coords, list):
            for r_idx, ring in enumerate(coords):
                if isinstance(ring, list) and len(ring) > 0:
                    if len(ring) < 4:
                        issues.append(f"Feature[{idx}]: Polygon ring {r_idx} has fewer than 4 positions.")
                        all_valid = False
                    elif ring[0] != ring[-1]:
                        issues.append(f"Feature[{idx}]: Polygon ring {r_idx} is not closed (first != last coordinate).")
                        all_valid = False

        # Shapely topological validity test
        try:
            geom = shape(g_dict)
            if not geom.is_valid:
                reason = explain_validity(geom)
                issues.append(f"Feature[{idx}] topological error: {reason}")
                all_valid = False
                
                # Attempt repair
                repaired_geom = make_valid(geom)
                if repaired_geom.is_empty:
                    repaired_geom = geom.buffer(0)
                repaired_features.append({
                    "type": "Feature",
                    "properties": feat.get("properties", {}),
                    "geometry": mapping(repaired_geom)
                })
            else:
                repaired_features.append(feat)
        except Exception as e:
            issues.append(f"Feature[{idx}] parsing error: {str(e)}")
            all_valid = False

    repaired_collection = None
    if not all_valid and repaired_features:
        repaired_collection = {
            "type": "FeatureCollection",
            "features": repaired_features
        }

    details = {
        "feature_count": len(features_list),
        "total_vertices": total_vertices,
        "geometry_types": list(geom_types_found),
        "has_issues": len(issues) > 0
    }

    return (len(issues) == 0), issues, repaired_collection, details


def extract_features_and_geometries(geojson_data: Dict[str, Any]) -> List[Tuple[Any, Dict[str, Any], str]]:
    """
    Extract list of (shapely_geom, properties_dict, feature_id) from GeoJSON data.
    """
    results = []
    geom_type = geojson_data.get("type")
    
    if geom_type == "FeatureCollection":
        features = geojson_data.get("features", [])
        for idx, feat in enumerate(features):
            g_dict = feat.get("geometry")
            if g_dict:
                geom = shape(g_dict)
                if not geom.is_valid:
                    geom = make_valid(geom)
                props = feat.get("properties", {}) or {}
                feat_id = feat.get("id", f"feature_{idx}")
                results.append((geom, props, str(feat_id)))
    elif geom_type == "Feature":
        g_dict = geojson_data.get("geometry")
        if g_dict:
            geom = shape(g_dict)
            if not geom.is_valid:
                geom = make_valid(geom)
            props = geojson_data.get("properties", {}) or {}
            feat_id = geojson_data.get("id", "feature_0")
            results.append((geom, props, str(feat_id)))
    else:
        # Bare geometry
        geom = shape(geojson_data)
        if not geom.is_valid:
            geom = make_valid(geom)
        results.append((geom, {}, "feature_0"))

    return results


def compute_compactness_ratio(area_m2: float, perimeter_m: float) -> float:
    """
    Compute Polsby-Popper / Isoperimetric quotient compactness: 4 * pi * Area / Perimeter^2.
    Value is 1.0 for a perfect circle, lower for irregular or elongated shapes.
    """
    if perimeter_m <= 0 or area_m2 <= 0:
        return 0.0
    ratio = (4.0 * math.pi * area_m2) / (perimeter_m ** 2)
    return round(min(ratio, 1.0), 4)
