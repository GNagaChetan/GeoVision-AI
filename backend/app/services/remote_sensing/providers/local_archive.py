import os
from typing import Dict, Any, List, Optional
from app.core.config import settings
from .base import BaseSatelliteProvider
from ..metadata import extract_raster_metadata

class LocalArchiveSatelliteProvider(BaseSatelliteProvider):
    """
    Satellite Provider interface accessing local high-resolution multispectral archive.
    """

    @property
    def provider_name(self) -> str:
        return "GeoVision Local Multispectral Archive (Sentinel-2 MSI / Landsat-9 OLI-2)"

    def search_scenes(
        self,
        bbox: List[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: float = 20.0
    ) -> List[Dict[str, Any]]:
        """Search local sample repository."""
        available_files = [
            ("sentinel2_multispectral_sample.tif", "Sentinel-2A", "MSI", "10m", "2024-04-12", "EPSG:32643", ["B02-Blue", "B03-Green", "B04-Red", "B08-NIR", "B11-SWIR1"]),
            ("landsat9_multispectral_sample.tif", "Landsat-9", "OLI-2", "30m", "2024-05-02", "EPSG:32643", ["B2-Blue", "B3-Green", "B4-Red", "B5-NIR", "B6-SWIR1", "B7-SWIR2"]),
            ("rgb_aerial_sample.tif", "Aerial Survey", "RGB Optical", "0.5m", "2024-06-10", "EPSG:4326", ["Red", "Green", "Blue"]),
            ("scene_2020_t1.png", "Sentinel-2 MSI", "MSI", "10m", "2020-03-15", "EPSG:4326", ["Red", "Green", "Blue", "NIR", "SWIR"]),
            ("scene_2025_t2.png", "Sentinel-2 MSI", "MSI", "10m", "2025-03-18", "EPSG:4326", ["Red", "Green", "Blue", "NIR", "SWIR"])
        ]

        results = []
        for filename, platform, sensor, gsd, date_str, crs_str, bands in available_files:
            file_p = os.path.join(settings.SAMPLE_DATA_DIR, filename)
            if os.path.exists(file_p):
                scene_id = os.path.splitext(filename)[0]
                results.append({
                    "id": scene_id,
                    "name": f"{platform} {sensor} Scene ({scene_id})",
                    "platform": platform,
                    "sensor": sensor,
                    "spatial_resolution": gsd,
                    "acquisition_date": date_str,
                    "crs": crs_str,
                    "bands_available": bands,
                    "file_path": file_p,
                    "rgb_url": f"/api/v1/samples/{filename}",
                    "cloud_cover_percentage": 1.2,
                    "is_sample_data": True
                })
        return results

    def fetch_scene_metadata(self, scene_id: str) -> Dict[str, Any]:
        """Fetch metadata for a local scene."""
        cand_tif = os.path.join(settings.SAMPLE_DATA_DIR, f"{scene_id}.tif")
        cand_png = os.path.join(settings.SAMPLE_DATA_DIR, f"{scene_id}.png")
        target = cand_tif if os.path.exists(cand_tif) else cand_png
        if not os.path.exists(target):
            raise FileNotFoundError(f"Scene {scene_id} not found in archive.")
        return extract_raster_metadata(target)

    def download_or_stream_band(self, scene_id: str, band_name: str) -> str:
        """Returns local file URI."""
        cand_tif = os.path.join(settings.SAMPLE_DATA_DIR, f"{scene_id}.tif")
        if os.path.exists(cand_tif):
            return cand_tif
        return os.path.join(settings.SAMPLE_DATA_DIR, f"{scene_id}.png")
