import pyproj
from typing import Dict, Any, List
from shapely.geometry import shape, mapping
from shapely.ops import transform

class CRSEngine:
    """
    Coordinate Reference System validator, catalog, and coordinate transformation engine.
    """

    def validate_and_describe_crs(self, crs_str: str) -> Dict[str, Any]:
        """
        Validate EPSG / PROJ string and return standardized metadata.
        """
        clean_crs = crs_str.strip()
        try:
            crs_obj = pyproj.CRS(clean_crs)
            
            # Extract EPSG code if available
            epsg_code = crs_obj.to_epsg()
            formatted_epsg = f"EPSG:{epsg_code}" if epsg_code else clean_crs
            
            # Extract axis and unit details
            axis_info = [f"{axis.name} ({axis.unit_name})" for axis in crs_obj.axis_info]
            
            return {
                "input_crs": clean_crs,
                "is_valid": True,
                "epsg_code": epsg_code,
                "formatted_crs": formatted_epsg,
                "name": crs_obj.name,
                "type": "Projected" if crs_obj.is_projected else "Geographic",
                "is_geographic": crs_obj.is_geographic,
                "is_projected": crs_obj.is_projected,
                "units": crs_obj.axis_info[0].unit_name if crs_obj.axis_info else "degrees",
                "axis_info": axis_info,
                "ellipsoid": crs_obj.ellipsoid.name if hasattr(crs_obj, "ellipsoid") and crs_obj.ellipsoid else "WGS 84",
                "datum": crs_obj.datum.name if hasattr(crs_obj, "datum") and crs_obj.datum else "World Geodetic System 1984",
                "proj4": crs_obj.to_proj4()
            }
        except Exception as e:
            return {
                "input_crs": clean_crs,
                "is_valid": False,
                "error": f"Invalid coordinate reference system: {str(e)}",
                "name": "Unknown CRS"
            }

    def transform_geojson_crs(
        self,
        geojson_data: Dict[str, Any],
        src_crs: str,
        dst_crs: str
    ) -> Dict[str, Any]:
        """
        Reproject all coordinates in a GeoJSON structure between source and destination CRS.
        """
        src = pyproj.CRS(src_crs)
        dst = pyproj.CRS(dst_crs)

        if src == dst:
            return geojson_data

        transformer = pyproj.Transformer.from_crs(src, dst, always_xy=True)

        def reproject_feature(feat: Dict[str, Any]) -> Dict[str, Any]:
            g_dict = feat.get("geometry")
            if not g_dict:
                return feat
            geom = shape(g_dict)
            reproj_geom = transform(transformer.transform, geom)
            return {
                **feat,
                "geometry": mapping(reproj_geom)
            }

        g_type = geojson_data.get("type")
        if g_type == "FeatureCollection":
            features = [reproject_feature(f) for f in geojson_data.get("features", [])]
            return {
                "type": "FeatureCollection",
                "features": features,
                "crs": {"type": "name", "properties": {"name": dst_crs}}
            }
        elif g_type == "Feature":
            return reproject_feature(geojson_data)
        else:
            # Bare geometry
            geom = shape(geojson_data)
            reproj_geom = transform(transformer.transform, geom)
            return mapping(reproj_geom)

crs_engine = CRSEngine()
