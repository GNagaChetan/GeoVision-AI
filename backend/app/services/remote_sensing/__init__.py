import os
import numpy as np
import cv2
from typing import Dict, Any, List, Optional, Tuple

from app.core.config import settings
from app.models.schemas import (
    RasterMetadata,
    RasterValidationResponse,
    BandVisualizationResponse,
    RGBCompositeResponse,
    FalseColorCompositeResponse,
    SpectralIndexResponse,
    StudyAreaProject
)

from .raster_io import load_raster, validate_raster, save_preview_image, resolve_raster_path
from .crs import validate_and_describe_crs, reproject_bounds_to_wgs84
from .metadata import extract_raster_metadata
from .bands import inspect_bands, visualize_single_band
from .composites import create_rgb_composite, create_false_color_composite
from .spectral import compute_spectral_index
from .study_area import create_study_area_project, list_study_area_projects, get_study_area_project
from .providers.base import BaseSatelliteProvider
from .providers.local_archive import LocalArchiveSatelliteProvider

class RemoteSensingService:
    """
    Unified Remote Sensing and Multispectral Satellite Analytics Engine.
    Handles GeoTIFF inspection, true/false color compositing, spectral indices,
    CRS validation, and study area project workflows.
    """

    def __init__(self, provider: Optional[BaseSatelliteProvider] = None):
        self.provider = provider or LocalArchiveSatelliteProvider()

    def get_sample_scenes(self) -> List[Dict[str, Any]]:
        """List verified sample satellite scenes."""
        return self.provider.search_scenes([], "2020-01-01", "2026-12-31")

    def validate_raster_file(self, path: str) -> Dict[str, Any]:
        """Validate raster integrity and georeferencing."""
        return validate_raster(path)

    def extract_metadata(self, path: str) -> Dict[str, Any]:
        """Extract spatial, CRS, and band metadata."""
        return extract_raster_metadata(path)

    def inspect_raster_bands(self, path: str) -> List[Dict[str, Any]]:
        """Inspect all individual bands with statistics and thumbnails."""
        return inspect_bands(path)

    def visualize_band(
        self,
        path: str,
        band_index: int = 1,
        colormap: str = "grayscale",
        percentile_min: float = 2.0,
        percentile_max: float = 98.0
    ) -> Dict[str, Any]:
        """Render single band visualizer."""
        return visualize_single_band(path, band_index, colormap, percentile_min, percentile_max)

    def make_rgb_composite(
        self,
        path: str,
        r_idx: int = 1,
        g_idx: int = 2,
        b_idx: int = 3,
        percentile_stretch: bool = True
    ) -> Dict[str, Any]:
        """Generate custom RGB composite."""
        return create_rgb_composite(path, r_idx, g_idx, b_idx, percentile_stretch)

    def make_false_color_composite(
        self,
        path: str,
        preset: str = "Color_Infrared",
        custom_r: Optional[int] = None,
        custom_g: Optional[int] = None,
        custom_b: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate False Color Composite with strict band validation."""
        return create_false_color_composite(path, preset, custom_r, custom_g, custom_b)

    def calculate_spectral_index(
        self,
        path: Optional[str] = None,
        index_type: str = "NDVI",
        nir_idx: Optional[int] = None,
        red_idx: Optional[int] = None,
        green_idx: Optional[int] = None,
        swir_idx: Optional[int] = None,
        blue_idx: Optional[int] = None
    ) -> Dict[str, Any]:
        """Calculate vegetation, water, or urban index."""
        return compute_spectral_index(
            path=path,
            index_type=index_type,
            nir_band_idx=nir_idx,
            red_band_idx=red_idx,
            green_band_idx=green_idx,
            swir_band_idx=swir_idx,
            blue_band_idx=blue_idx
        )

    # Backward compatibility helpers
    def process_multispectral_scene(
        self,
        nir_path: str,
        red_path: str,
        green_path: Optional[str] = None,
        swir_path: Optional[str] = None,
        index_type: str = "NDVI"
    ) -> SpectralIndexResponse:
        """Backward-compatible spectral index calculator using separate band files."""
        nir = cv2.imread(nir_path, cv2.IMREAD_GRAYSCALE)
        red = cv2.imread(red_path, cv2.IMREAD_GRAYSCALE)
        green = cv2.imread(green_path, cv2.IMREAD_GRAYSCALE) if green_path and os.path.exists(green_path) else None
        swir = cv2.imread(swir_path, cv2.IMREAD_GRAYSCALE) if swir_path and os.path.exists(swir_path) else None

        res_dict = compute_spectral_index(
            index_type=index_type,
            raw_nir=nir,
            raw_red=red,
            raw_green=green,
            raw_swir=swir
        )
        return SpectralIndexResponse(**res_dict)

    def generate_false_color_composite(
        self,
        nir_path: str,
        red_path: str,
        green_path: str,
        preset: str = "Standard_FCC"
    ) -> Tuple[str, str]:
        """Backward-compatible FCC generator using separate band files."""
        nir = cv2.imread(nir_path, cv2.IMREAD_GRAYSCALE)
        red = cv2.imread(red_path, cv2.IMREAD_GRAYSCALE)
        green = cv2.imread(green_path, cv2.IMREAD_GRAYSCALE)

        if nir is None or red is None or green is None:
            raise FileNotFoundError("Missing band files for false color composite.")

        fcc_bgr = cv2.merge([green, red, nir])
        _, rel_url = save_preview_image(fcc_bgr, prefix=f"fcc_{preset.lower()}")
        abs_p = os.path.join(settings.PROCESSED_DIR, os.path.basename(rel_url))
        return abs_p, rel_url

rs_service = RemoteSensingService()
