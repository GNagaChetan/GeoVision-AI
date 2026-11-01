import os
from typing import Dict, Any, List, Optional
import pyproj
from shapely.geometry import box, mapping

class RasterGISEngine:
    """
    GIS raster metadata extractor, CRS reprojector, and footprint builder.
    Supports Rasterio with fallback to tifffile/gdal.
    """

    def extract_raster_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Extract GIS metadata: CRS, transform, resolution, GSD, bounds, geographic footprint.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Raster file not found: {file_path}")

        try:
            import rasterio
            with rasterio.open(file_path) as src:
                width = src.width
                height = src.height
                count = src.count
                crs_str = str(src.crs) if src.crs else "EPSG:4326"
                bounds = src.bounds # left, bottom, right, top
                res = list(src.res) if hasattr(src, "res") else [10.0, 10.0]
                transform_matrix = list(src.transform) if hasattr(src, "transform") else []
                nodata = src.nodata
                dtypes = [str(t) for t in src.dtypes]

                # Reproject native bounds to WGS84
                minx, miny, maxx, maxy = bounds.left, bounds.bottom, bounds.right, bounds.top
                wgs84_bounds, geojson_polygon = self._reproject_bounds(minx, miny, maxx, maxy, crs_str)

                return {
                    "filename": os.path.basename(file_path),
                    "file_path": file_path,
                    "format": src.driver if hasattr(src, "driver") else "GTiff",
                    "width": width,
                    "height": height,
                    "band_count": count,
                    "crs": crs_str,
                    "spatial_resolution": [round(abs(r), 4) for r in res],
                    "bounds_native": [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)],
                    "bounds_wgs84": wgs84_bounds,
                    "geographic_extent": geojson_polygon,
                    "nodata_value": nodata,
                    "data_types": dtypes,
                    "transform": transform_matrix,
                    "is_valid": True
                }
        except ImportError:
            # Fallback to metadata extractor in remote_sensing
            from app.services.remote_sensing.metadata import extract_geotiff_metadata
            meta = extract_geotiff_metadata(file_path)
            return {
                "filename": meta.filename,
                "file_path": meta.file_path,
                "format": meta.format,
                "width": meta.width,
                "height": meta.height,
                "band_count": meta.band_count,
                "crs": meta.crs,
                "spatial_resolution": meta.spatial_resolution,
                "bounds_native": meta.bounds_native,
                "bounds_wgs84": meta.bounds_wgs84,
                "geographic_extent": meta.geographic_extent,
                "nodata_value": meta.nodata_value,
                "data_types": [b.data_type for b in meta.bands],
                "transform": [],
                "is_valid": meta.is_valid_raster
            }

    def _reproject_bounds(self, minx: float, miny: float, maxx: float, maxy: float, crs_str: str):
        try:
            src_crs = pyproj.CRS(crs_str)
            wgs84 = pyproj.CRS("EPSG:4326")
            if src_crs == wgs84 or crs_str.upper() in ("EPSG:4326", "WGS84"):
                wgs84_bounds = [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)]
            else:
                transformer = pyproj.Transformer.from_crs(src_crs, wgs84, always_xy=True)
                bl_lon, bl_lat = transformer.transform(minx, miny)
                tr_lon, tr_lat = transformer.transform(maxx, maxy)
                wgs84_bounds = [
                    round(min(bl_lon, tr_lon), 6),
                    round(min(bl_lat, tr_lat), 6),
                    round(max(bl_lon, tr_lon), 6),
                    round(max(bl_lat, tr_lat), 6)
                ]
            
            # Construct GeoJSON Polygon
            poly = box(wgs84_bounds[0], wgs84_bounds[1], wgs84_bounds[2], wgs84_bounds[3])
            return wgs84_bounds, mapping(poly)
        except Exception:
            wgs84_bounds = [round(minx, 6), round(miny, 6), round(maxx, 6), round(maxy, 6)]
            poly = box(minx, miny, maxx, maxy)
            return wgs84_bounds, mapping(poly)

raster_gis_engine = RasterGISEngine()
