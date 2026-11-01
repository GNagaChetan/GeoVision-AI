import os
import uuid
import numpy as np
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from typing import Dict, Any, List, Optional, Tuple
from app.core.config import settings
from app.services.remote_sensing.raster_io import load_raster, resolve_raster_path
from app.models.schemas import (
    NDVIThresholdRange,
    NDVIAnalysisResponse,
    HistogramData
)

# Standard Academic 4-Tier NDVI Classification
NDVI_THRESHOLDS = [
    {
        "category": "Water & Clouds",
        "min_val": -1.0,
        "max_val": 0.0,
        "color_hex": "#06b6d4",
        "description": "Deep water bodies, streams, cloud shadows, snow cover"
    },
    {
        "category": "Bare Soil & Built-Up",
        "min_val": 0.0,
        "max_val": 0.2,
        "color_hex": "#a16207",
        "description": "Barren land, exposed soil, paved roads, urban concrete"
    },
    {
        "category": "Moderate Vegetation",
        "min_val": 0.2,
        "max_val": 0.5,
        "color_hex": "#84cc16",
        "description": "Grasslands, shrublands, sparse foliage, maturing crops"
    },
    {
        "category": "Dense Healthy Forest",
        "min_val": 0.5,
        "max_val": 1.0,
        "color_hex": "#15803d",
        "description": "Dense tropical canopy, healthy woodland, high chlorophyll biomass"
    },
]

class VegetationAnalyticsService:
    """
    Multispectral Vegetation Analytics & NDVI Engine.
    Computes rigorous NDVI with safe zero-denominator handling, user band selection,
    4-tier threshold distribution, statistical moments (mean, median, std dev), and histograms.
    """

    def calculate_ndvi(
        self,
        raster_path: Optional[str] = None,
        red_band_idx: Optional[int] = None,
        nir_band_idx: Optional[int] = None,
        colormap: str = "RdYlGn",
        pixel_res_meters: float = 10.0
    ) -> NDVIAnalysisResponse:
        """
        Execute NDVI computation: (NIR - Red) / (NIR + Red) with band availability verification.
        """
        resolved_path = resolve_raster_path(raster_path)
        if not os.path.exists(resolved_path):
            return NDVIAnalysisResponse(
                success=False,
                mean_ndvi=0.0,
                median_ndvi=0.0,
                min_ndvi=0.0,
                max_ndvi=0.0,
                std_dev_ndvi=0.0,
                colormap_url="",
                histogram=HistogramData(bins=[], counts_gray=[]),
                threshold_distribution=[],
                dominant_vegetation_health="Unknown",
                academic_formula="NDVI = (NIR - Red) / (NIR + Red)",
                required_bands_present=False,
                message=f"Raster file not found at '{resolved_path}'."
            )

        raster_arr, meta = load_raster(resolved_path)
        total_bands = raster_arr.shape[0]

        # -------------------------------------------------------------
        # Band Presence & Verification (Strict Zero Hallucination)
        # -------------------------------------------------------------
        # For Sentinel-2 sample (5 bands): Red=3, NIR=4
        # For Landsat-9 sample (6 bands): Red=3, NIR=4
        # If user explicitly passed band indices, validate 1-based index range
        r_idx = red_band_idx if red_band_idx is not None else 3
        n_idx = nir_band_idx if nir_band_idx is not None else 4

        # Validate band count compatibility
        if total_bands < 2 or r_idx > total_bands or n_idx > total_bands or r_idx < 1 or n_idx < 1 or r_idx == n_idx:
            # Missing required NIR/Red bands
            return NDVIAnalysisResponse(
                success=False,
                mean_ndvi=0.0,
                median_ndvi=0.0,
                min_ndvi=0.0,
                max_ndvi=0.0,
                std_dev_ndvi=0.0,
                colormap_url="",
                histogram=HistogramData(bins=[], counts_gray=[]),
                threshold_distribution=[],
                dominant_vegetation_health="Unavailable",
                academic_formula="NDVI = (NIR - Red) / (NIR + Red)",
                required_bands_present=False,
                message="NDVI cannot be calculated because the required Red and NIR bands are unavailable."
            )

        red = raster_arr[r_idx - 1].astype(np.float64)
        nir = raster_arr[n_idx - 1].astype(np.float64)

        # -------------------------------------------------------------
        # Mathematical Formula with Safe Zero-Denominator Handling
        # -------------------------------------------------------------
        numerator = nir - red
        denominator = nir + red

        # Safe division: zero out pixels where denominator == 0
        ndvi_arr = np.zeros_like(numerator, dtype=np.float64)
        valid_mask = (denominator != 0) & ~np.isnan(denominator)
        ndvi_arr[valid_mask] = numerator[valid_mask] / denominator[valid_mask]
        ndvi_arr = np.clip(ndvi_arr, -1.0, 1.0)

        # -------------------------------------------------------------
        # Statistical Moments
        # -------------------------------------------------------------
        min_val = float(np.min(ndvi_arr))
        max_val = float(np.max(ndvi_arr))
        mean_val = float(np.mean(ndvi_arr))
        median_val = float(np.median(ndvi_arr))
        std_val = float(np.std(ndvi_arr))

        # -------------------------------------------------------------
        # 4-Tier Threshold Classification
        # -------------------------------------------------------------
        h, w = ndvi_arr.shape
        total_pixels = h * w
        pixel_area_ha = (pixel_res_meters * pixel_res_meters) / 10000.0

        threshold_results = []
        max_tier_count = -1
        dominant_health = "Moderate Vegetation"

        for tier in NDVI_THRESHOLDS:
            t_min = tier["min_val"]
            t_max = tier["max_val"]
            if t_min == -1.0:
                mask = (ndvi_arr <= t_max)
            elif t_max == 1.0:
                mask = (ndvi_arr > t_min) & (ndvi_arr <= t_max)
            else:
                mask = (ndvi_arr > t_min) & (ndvi_arr <= t_max)

            count = int(np.sum(mask))
            ha = round(count * pixel_area_ha, 3)
            pct = round((count / total_pixels) * 100.0, 2)

            if count > max_tier_count:
                max_tier_count = count
                dominant_health = tier["category"]

            threshold_results.append(NDVIThresholdRange(
                category=tier["category"],
                min_val=tier["min_val"],
                max_val=tier["max_val"],
                color_hex=tier["color_hex"],
                pixel_count=count,
                area_ha=ha,
                percentage=pct,
                description=tier["description"]
            ))

        # -------------------------------------------------------------
        # 256-Bin Histogram
        # -------------------------------------------------------------
        hist_counts, bin_edges = np.histogram(ndvi_arr, bins=100, range=(-1.0, 1.0))
        hist_bins = [int(i) for i in range(100)]
        histogram_data = HistogramData(
            bins=hist_bins,
            counts_gray=[int(c) for c in hist_counts]
        )

        # -------------------------------------------------------------
        # Colormap Rendering
        # -------------------------------------------------------------
        # Normalize [-1.0, 1.0] to [0.0, 1.0]
        norm_ndvi = (ndvi_arr + 1.0) / 2.0
        cmap = plt.get_cmap(colormap if colormap in ['RdYlGn', 'viridis', 'plasma', 'Spectral'] else 'RdYlGn')
        colored = (cmap(norm_ndvi)[:, :, :3] * 255).astype(np.uint8)
        colored_bgr = cv2.cvtColor(colored, cv2.COLOR_RGB2BGR)

        filename = f"ndvi_{uuid.uuid4().hex[:8]}.png"
        abs_path = os.path.join(settings.PROCESSED_DIR, filename)
        cv2.imwrite(abs_path, colored_bgr)
        colormap_url = f"/api/v1/processed/{filename}"

        return NDVIAnalysisResponse(
            success=True,
            mean_ndvi=round(mean_val, 4),
            median_ndvi=round(median_val, 4),
            min_ndvi=round(min_val, 4),
            max_ndvi=round(max_val, 4),
            std_dev_ndvi=round(std_val, 4),
            colormap_url=colormap_url,
            histogram=histogram_data,
            threshold_distribution=threshold_results,
            dominant_vegetation_health=dominant_health,
            academic_formula="NDVI = (NIR - Red) / (NIR + Red)",
            required_bands_present=True,
            message="NDVI computed successfully with verified NIR and Red channels."
        )

vegetation_service = VegetationAnalyticsService()
