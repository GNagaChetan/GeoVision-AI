import os
import uuid
import numpy as np
import cv2
from typing import Dict, Any, Tuple, Optional, List
from app.core.config import settings
from app.models.schemas import (
    RasterMetadata,
    SpectralIndexResponse,
    HistogramData
)

class RemoteSensingService:
    """
    Remote Sensing & Spectral Analytics Engine.
    Handles multispectral band arithmetic, vegetation/water indices, and geospatial metadata.
    """

    @staticmethod
    def compute_spectral_index(
        band_a: np.ndarray,
        band_b: np.ndarray,
        index_type: str
    ) -> Tuple[np.ndarray, Dict[str, float], str, str]:
        """
        Compute normalized difference spectral index: (A - B) / (A + B + eps).
        Returns (index_array, stats, academic_formula, interpretation).
        """
        a_f = band_a.astype(np.float32)
        b_f = band_b.astype(np.float32)
        
        denominator = a_f + b_f
        # Mask out zeros or negatives in denominator
        mask = denominator > 1e-6
        index_arr = np.zeros_like(a_f, dtype=np.float32)
        index_arr[mask] = (a_f[mask] - b_f[mask]) / denominator[mask]
        index_arr = np.clip(index_arr, -1.0, 1.0)

        mean_val = float(np.mean(index_arr))
        min_val = float(np.min(index_arr))
        max_val = float(np.max(index_arr))
        std_val = float(np.std(index_arr))

        stats = {
            "mean": round(mean_val, 4),
            "min": round(min_val, 4),
            "max": round(max_val, 4),
            "std": round(std_val, 4)
        }

        if index_type.upper() == "NDVI":
            formula = r"\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}"
            interp = (
                f"Mean NDVI of {mean_val:.2f} indicates "
                f"{'dense healthy vegetation canopy' if mean_val > 0.5 else 'moderate/sparse vegetation or mixed terrain' if mean_val > 0.2 else 'water bodies, barren land or urban surface'}."
            )
        elif index_type.upper() == "NDWI":
            formula = r"\text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}"
            interp = (
                f"Mean NDWI of {mean_val:.2f} indicates "
                f"{'high surface water presence and saturated wetland' if mean_val > 0.1 else 'dry land and terrestrial features with minimal standing water'}."
            )
        elif index_type.upper() == "NDBI":
            formula = r"\text{NDBI} = \frac{\text{SWIR} - \text{NIR}}{\text{SWIR} + \text{NIR}}"
            interp = (
                f"Mean NDBI of {mean_val:.2f} measures "
                f"{'significant built-up impervious surface / structural density' if mean_val > 0.1 else 'non-built vegetated or water cover'}."
            )
        else:
            formula = r"\text{Index} = \frac{A - B}{A + B}"
            interp = f"Normalized difference computed with mean {mean_val:.2f}."

        return index_arr, stats, formula, interp

    @staticmethod
    def render_colormap(index_arr: np.ndarray, colormap_type: int = cv2.COLORMAP_VIRIDIS) -> Tuple[str, str]:
        """Convert normalized [-1, 1] index to RGB color visualization image."""
        norm_0_255 = ((index_arr + 1.0) * 127.5).astype(np.uint8)
        colored = cv2.applyColorMap(norm_0_255, colormap_type)
        filename = f"index_{uuid.uuid4().hex[:8]}.png"
        abs_path = os.path.join(settings.PROCESSED_DIR, filename)
        cv2.imwrite(abs_path, colored)
        return abs_path, f"/api/v1/processed/{filename}"

    def process_multispectral_scene(
        self,
        nir_path: str,
        red_path: str,
        green_path: Optional[str] = None,
        swir_path: Optional[str] = None,
        index_type: str = "NDVI"
    ) -> SpectralIndexResponse:
        nir = cv2.imread(nir_path, cv2.IMREAD_GRAYSCALE)
        red = cv2.imread(red_path, cv2.IMREAD_GRAYSCALE)
        
        if nir is None or red is None:
            raise FileNotFoundError("Could not read specified NIR or Red band files.")

        idx_upper = index_type.upper()
        if idx_upper == "NDVI":
            band_a, band_b = nir, red
            cmap = cv2.COLORMAP_SUMMER
        elif idx_upper == "NDWI":
            if green_path and os.path.exists(green_path):
                green = cv2.imread(green_path, cv2.IMREAD_GRAYSCALE)
            else:
                green = red # fallback if single band test
            band_a, band_b = green, nir
            cmap = cv2.COLORMAP_OCEAN
        elif idx_upper == "NDBI":
            if swir_path and os.path.exists(swir_path):
                swir = cv2.imread(swir_path, cv2.IMREAD_GRAYSCALE)
            else:
                swir = red
            band_a, band_b = swir, nir
            cmap = cv2.COLORMAP_HOT
        else:
            band_a, band_b = nir, red
            cmap = cv2.COLORMAP_VIRIDIS

        index_arr, stats, formula, interp = self.compute_spectral_index(band_a, band_b, idx_upper)
        _, colormap_url = self.render_colormap(index_arr, cmap)

        # Histogram of index values scaled [-1, 1] into 50 bins
        hist_counts, bin_edges = np.histogram(index_arr, bins=50, range=(-1.0, 1.0))
        hist_data = HistogramData(
            bins=[int((bin_edges[i] + bin_edges[i+1]) * 50) for i in range(50)],
            counts_gray=[int(c) for c in hist_counts]
        )

        return SpectralIndexResponse(
            index_type=idx_upper,
            mean_value=stats["mean"],
            min_value=stats["min"],
            max_value=stats["max"],
            std_value=stats["std"],
            colormap_image_url=colormap_url,
            histogram=hist_data,
            academic_formula=formula,
            interpretation=interp
        )

    def generate_false_color_composite(
        self,
        nir_path: str,
        red_path: str,
        green_path: str,
        preset: str = "Standard_FCC"
    ) -> Tuple[str, str]:
        """
        Generate False Color Composite (FCC) for vegetation or urban analysis.
        Standard FCC: R=NIR, G=Red, B=Green
        """
        nir = cv2.imread(nir_path, cv2.IMREAD_GRAYSCALE)
        red = cv2.imread(red_path, cv2.IMREAD_GRAYSCALE)
        green = cv2.imread(green_path, cv2.IMREAD_GRAYSCALE)

        if nir is None or red is None or green is None:
            raise FileNotFoundError("Missing required bands for false color composite.")

        # OpenCV expects BGR order
        fcc_bgr = cv2.merge([green, red, nir])
        filename = f"fcc_{preset.lower()}_{uuid.uuid4().hex[:8]}.png"
        abs_path = os.path.join(settings.PROCESSED_DIR, filename)
        cv2.imwrite(abs_path, fcc_bgr)
        return abs_path, f"/api/v1/processed/{filename}"

rs_service = RemoteSensingService()
