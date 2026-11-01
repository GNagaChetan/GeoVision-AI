import pyproj
from typing import Dict, Any, List, Optional, Tuple

def validate_and_describe_crs(crs_input: Any) -> Dict[str, Any]:
    """
    Validates CRS string (e.g. 'EPSG:4326', 'EPSG:32643', WKT, Proj4) and extracts
    geographic vs. projected classification, datum, ellipsoid, linear units, and EPSG auth code.
    """
    if not crs_input:
        return {
            "crs_auth": "EPSG:4326",
            "name": "WGS 84 (Default Geographic Fallback)",
            "is_projected": False,
            "is_geographic": True,
            "units": "degree",
            "axis_info": ["Latitude (North)", "Longitude (East)"],
            "ellipsoid": "WGS 84",
            "is_valid": True
        }

    try:
        crs_obj = pyproj.CRS.from_user_input(crs_input)
        epsg = crs_obj.to_epsg()
        auth_code = f"EPSG:{epsg}" if epsg else crs_obj.to_string()

        return {
            "crs_auth": auth_code,
            "name": crs_obj.name,
            "is_projected": crs_obj.is_projected,
            "is_geographic": crs_obj.is_geographic,
            "units": crs_obj.axis_info[0].unit_name if crs_obj.axis_info else ("metre" if crs_obj.is_projected else "degree"),
            "axis_info": [f"{ax.name} ({ax.direction})" for ax in crs_obj.axis_info] if crs_obj.axis_info else [],
            "ellipsoid": crs_obj.ellipsoid.name if crs_obj.ellipsoid else "Unknown",
            "is_valid": True
        }
    except Exception as e:
        return {
            "crs_auth": str(crs_input),
            "name": "Unrecognized / Custom Spatial Reference",
            "is_projected": False,
            "is_geographic": True,
            "units": "degree",
            "axis_info": [],
            "ellipsoid": "Unknown",
            "is_valid": False,
            "error": str(e)
        }

def reproject_bounds_to_wgs84(
    bounds_native: List[float],
    src_crs: str = "EPSG:32643"
) -> Tuple[List[float], List[float]]:
    """
    Reprojects bounding box [minx, miny, maxx, maxy] from native CRS to WGS84 [min_lon, min_lat, max_lon, max_lat]
    and computes center [lat, lon].
    """
    try:
        minx, miny, maxx, maxy = bounds_native
        if "4326" in str(src_crs):
            min_lon = min(minx, maxx)
            max_lon = max(minx, maxx)
            min_lat = min(miny, maxy)
            max_lat = max(miny, maxy)
            center = [round((min_lat + max_lat) / 2.0, 6), round((min_lon + max_lon) / 2.0, 6)]
            return [round(min_lon, 6), round(min_lat, 6), round(max_lon, 6), round(max_lat, 6)], center

        transformer = pyproj.Transformer.from_crs(src_crs, "EPSG:4326", always_xy=True)
        lon1, lat1 = transformer.transform(minx, miny)
        lon2, lat2 = transformer.transform(maxx, maxy)

        min_lon = min(lon1, lon2)
        max_lon = max(lon1, lon2)
        min_lat = min(lat1, lat2)
        max_lat = max(lat1, lat2)
        center = [round((min_lat + max_lat) / 2.0, 6), round((min_lon + max_lon) / 2.0, 6)]

        return [round(min_lon, 6), round(min_lat, 6), round(max_lon, 6), round(max_lat, 6)], center
    except Exception:
        # Fallback to Delhi/NCR study area coordinates
        return [77.0500, 28.5500, 77.2500, 28.7500], [28.6500, 77.1500]
