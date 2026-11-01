import numpy as np
import cv2
from typing import Dict, Any, Optional, Tuple
from app.models.schemas import HistogramData
from .raster_io import load_raster, save_preview_image, resolve_raster_path

def compute_spectral_index(
    path: Optional[str] = None,
    index_type: str = "NDVI",
    nir_band_idx: Optional[int] = None,
    red_band_idx: Optional[int] = None,
    green_band_idx: Optional[int] = None,
    swir_band_idx: Optional[int] = None,
    blue_band_idx: Optional[int] = None,
    raw_nir: Optional[np.ndarray] = None,
    raw_red: Optional[np.ndarray] = None,
    raw_green: Optional[np.ndarray] = None,
    raw_swir: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Computes normalized difference or non-linear vegetation/water/built-up index.
    Strictly checks band availability: if required band is missing, returns clear error response.
    """
    idx_upper = index_type.upper().strip()

    if path:
        resolved = resolve_raster_path(path)
        data, _ = load_raster(resolved)
        total_bands = data.shape[0]

        # Infer band indices if not explicitly passed
        # Sentinel-2 stack: 1=Blue, 2=Green, 3=Red, 4=NIR, 5=SWIR
        if total_bands >= 4:
            nir = data[nir_band_idx - 1] if nir_band_idx else data[3] # Band 4
            red = data[red_band_idx - 1] if red_band_idx else data[2] # Band 3
            green = data[green_band_idx - 1] if green_band_idx else data[1] # Band 2
            swir = data[swir_band_idx - 1] if (swir_band_idx and swir_band_idx <= total_bands) else (data[4] if total_bands >= 5 else None)
            blue = data[blue_band_idx - 1] if blue_band_idx else data[0]
        elif total_bands == 3:
            # 3-band RGB image (no NIR band!)
            red = data[0]
            green = data[1]
            blue = data[2]
            nir = None
            swir = None
        else:
            red = data[0]
            green = data[0]
            blue = data[0]
            nir = None
            swir = None
    else:
        nir = raw_nir
        red = raw_red
        green = raw_green
        swir = raw_swir
        blue = None

    # Check required bands for each index
    if idx_upper in ["NDVI", "SAVI", "EVI"]:
        if nir is None or red is None:
            return {
                "index_type": idx_upper,
                "mean_value": 0.0,
                "min_value": 0.0,
                "max_value": 0.0,
                "std_value": 0.0,
                "colormap_image_url": "",
                "histogram": HistogramData(bins=list(range(50)), counts_gray=[0]*50),
                "academic_formula": r"\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}",
                "interpretation": "Cannot compute NDVI: NIR (Near-Infrared) spectral band is required but not present in the raster.",
                "required_bands_present": False,
                "message": "Near-Infrared (NIR) band missing. Multi-spectral imagery with at least 4 bands is required for NDVI."
            }

        nir_f = nir.astype(np.float32)
        red_f = red.astype(np.float32)

        if idx_upper == "NDVI":
            denom = nir_f + red_f
            mask = denom > 1e-6
            index_arr = np.zeros_like(nir_f, dtype=np.float32)
            index_arr[mask] = (nir_f[mask] - red_f[mask]) / denom[mask]
            formula = r"\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}"
            cmap = cv2.COLORMAP_SUMMER

        elif idx_upper == "SAVI":
            # Soil-Adjusted Vegetation Index (L = 0.5)
            L = 0.5
            denom = nir_f + red_f + L
            index_arr = ((nir_f - red_f) * (1.0 + L)) / (denom + 1e-6)
            formula = r"\text{SAVI} = \frac{(\text{NIR} - \text{Red})(1 + L)}{\text{NIR} + \text{Red} + L}, \quad L=0.5"
            cmap = cv2.COLORMAP_SUMMER

        elif idx_upper == "EVI":
            # Enhanced Vegetation Index EVI = 2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)
            b_f = blue.astype(np.float32) if blue is not None else red_f * 0.5
            denom = nir_f + 6.0 * red_f - 7.5 * b_f + 1.0
            index_arr = 2.5 * (nir_f - red_f) / (denom + 1e-6)
            formula = r"\text{EVI} = 2.5 \cdot \frac{\text{NIR} - \text{Red}}{\text{NIR} + 6\text{Red} - 7.5\text{Blue} + 1}"
            cmap = cv2.COLORMAP_SUMMER

    elif idx_upper == "NDWI":
        if green is None or nir is None:
            return {
                "index_type": idx_upper,
                "mean_value": 0.0,
                "min_value": 0.0,
                "max_value": 0.0,
                "std_value": 0.0,
                "colormap_image_url": "",
                "histogram": HistogramData(bins=list(range(50)), counts_gray=[0]*50),
                "academic_formula": r"\text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}",
                "interpretation": "Cannot compute NDWI: Requires Green and Near-Infrared (NIR) bands.",
                "required_bands_present": False,
                "message": "Near-Infrared (NIR) band missing. Multi-spectral imagery is required for McFeeters NDWI."
            }
        grn_f = green.astype(np.float32)
        nir_f = nir.astype(np.float32)
        denom = grn_f + nir_f
        mask = denom > 1e-6
        index_arr = np.zeros_like(grn_f, dtype=np.float32)
        index_arr[mask] = (grn_f[mask] - nir_f[mask]) / denom[mask]
        formula = r"\text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}"
        cmap = cv2.COLORMAP_OCEAN

    elif idx_upper == "NDBI":
        if swir is None or nir is None:
            return {
                "index_type": idx_upper,
                "mean_value": 0.0,
                "min_value": 0.0,
                "max_value": 0.0,
                "std_value": 0.0,
                "colormap_image_url": "",
                "histogram": HistogramData(bins=list(range(50)), counts_gray=[0]*50),
                "academic_formula": r"\text{NDBI} = \frac{\text{SWIR} - \text{NIR}}{\text{SWIR} + \text{NIR}}",
                "interpretation": "Cannot compute NDBI: Requires SWIR (Shortwave-Infrared) and NIR bands.",
                "required_bands_present": False,
                "message": "Shortwave-Infrared (SWIR) band missing. Minimum 5 spectral bands required."
            }
        swir_f = swir.astype(np.float32)
        nir_f = nir.astype(np.float32)
        denom = swir_f + nir_f
        mask = denom > 1e-6
        index_arr = np.zeros_like(swir_f, dtype=np.float32)
        index_arr[mask] = (swir_f[mask] - nir_f[mask]) / denom[mask]
        formula = r"\text{NDBI} = \frac{\text{SWIR} - \text{NIR}}{\text{SWIR} + \text{NIR}}"
        cmap = cv2.COLORMAP_HOT

    elif idx_upper == "GNDVI":
        if green is None or nir is None:
            return {
                "index_type": idx_upper,
                "mean_value": 0.0,
                "min_value": 0.0,
                "max_value": 0.0,
                "std_value": 0.0,
                "colormap_image_url": "",
                "histogram": HistogramData(bins=list(range(50)), counts_gray=[0]*50),
                "academic_formula": r"\text{GNDVI} = \frac{\text{NIR} - \text{Green}}{\text{NIR} + \text{Green}}",
                "interpretation": "Cannot compute GNDVI: Green and NIR bands required.",
                "required_bands_present": False,
                "message": "NIR band missing."
            }
        grn_f = green.astype(np.float32)
        nir_f = nir.astype(np.float32)
        denom = nir_f + grn_f
        mask = denom > 1e-6
        index_arr = np.zeros_like(grn_f, dtype=np.float32)
        index_arr[mask] = (nir_f[mask] - grn_f[mask]) / denom[mask]
        formula = r"\text{GNDVI} = \frac{\text{NIR} - \text{Green}}{\text{NIR} + \text{Green}}"
        cmap = cv2.COLORMAP_SUMMER

    else:
        # Default NDVI
        if nir is None or red is None:
            return {
                "index_type": idx_upper,
                "mean_value": 0.0,
                "min_value": 0.0,
                "max_value": 0.0,
                "std_value": 0.0,
                "colormap_image_url": "",
                "histogram": HistogramData(bins=list(range(50)), counts_gray=[0]*50),
                "academic_formula": r"\text{Index} = \frac{A - B}{A + B}",
                "interpretation": "Missing required spectral bands.",
                "required_bands_present": False,
                "message": "Required spectral bands missing."
            }
        nir_f = nir.astype(np.float32)
        red_f = red.astype(np.float32)
        denom = nir_f + red_f
        mask = denom > 1e-6
        index_arr = np.zeros_like(nir_f, dtype=np.float32)
        index_arr[mask] = (nir_f[mask] - red_f[mask]) / denom[mask]
        formula = r"\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}"
        cmap = cv2.COLORMAP_SUMMER

    index_arr = np.clip(index_arr, -1.0, 1.0)
    mean_val = float(np.mean(index_arr))
    min_val = float(np.min(index_arr))
    max_val = float(np.max(index_arr))
    std_val = float(np.std(index_arr))

    # Render pseudocolor map
    norm_0_255 = ((index_arr + 1.0) * 127.5).astype(np.uint8)
    colored_bgr = cv2.applyColorMap(norm_0_255, cmap)
    colored_rgb = cv2.cvtColor(colored_bgr, cv2.COLOR_BGR2RGB)
    _, colormap_url = save_preview_image(colored_rgb, prefix=f"index_{idx_upper.lower()}")

    # 50-bin histogram of values in [-1, 1]
    hist_counts, bin_edges = np.histogram(index_arr.flatten(), bins=50, range=(-1.0, 1.0))
    hist_data = HistogramData(
        bins=[int((bin_edges[i] + bin_edges[i+1]) * 50) for i in range(50)],
        counts_gray=[int(c) for c in hist_counts]
    )

    if idx_upper == "NDVI":
        interp = f"Mean NDVI: {mean_val:.2f}. Indicates {'dense, healthy canopy' if mean_val > 0.4 else 'moderate vegetation or mixed agricultural terrain' if mean_val > 0.2 else 'sparse vegetation, water or urban surface'}."
    elif idx_upper == "NDWI":
        interp = f"Mean NDWI: {mean_val:.2f}. Indicates {'surface water presence & saturated soil' if mean_val > 0.1 else 'dry land and terrestrial surfaces'}."
    elif idx_upper == "NDBI":
        interp = f"Mean NDBI: {mean_val:.2f}. Indicates {'dense urban built-up surface' if mean_val > 0.1 else 'vegetated or natural landscape'}."
    else:
        interp = f"Mean {idx_upper}: {mean_val:.2f}."

    return {
        "index_type": idx_upper,
        "mean_value": round(mean_val, 4),
        "min_value": round(min_val, 4),
        "max_value": round(max_val, 4),
        "std_value": round(std_val, 4),
        "colormap_image_url": colormap_url,
        "histogram": hist_data,
        "academic_formula": formula,
        "interpretation": interp,
        "required_bands_present": True,
        "message": None
    }
