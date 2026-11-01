import numpy as np
import cv2
from typing import Dict, Any, List, Tuple
from app.models.schemas import HistogramData
from .raster_io import load_raster, save_preview_image, resolve_raster_path
from .metadata import extract_raster_metadata

def inspect_bands(path: str) -> List[Dict[str, Any]]:
    """
    Inspects all individual bands in the raster and generates thumbnail previews and statistical descriptors.
    """
    resolved = resolve_raster_path(path)
    data, _ = load_raster(resolved)
    meta = extract_raster_metadata(resolved)
    bands_count = data.shape[0]

    results = []
    for i in range(bands_count):
        band_arr = data[i]
        band_idx = i + 1
        
        # Percentile contrast stretch for visualization
        p2, p98 = np.percentile(band_arr, (2, 98))
        if p98 > p2:
            stretched = np.clip((band_arr.astype(np.float32) - p2) / (p98 - p2) * 255.0, 0, 255).astype(np.uint8)
        else:
            stretched = cv2.normalize(band_arr, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

        _, preview_url = save_preview_image(stretched, prefix=f"band_{band_idx}")

        b_meta = meta["bands"][i] if i < len(meta["bands"]) else {
            "band_index": band_idx,
            "name": f"Band {band_idx}",
            "wavelength_nm": None,
            "common_name": None,
            "min_val": float(np.min(band_arr)),
            "max_val": float(np.max(band_arr)),
            "mean_val": float(np.mean(band_arr)),
            "std_val": float(np.std(band_arr))
        }

        b_meta["preview_url"] = preview_url
        results.append(b_meta)

    return results

def visualize_single_band(
    path: str,
    band_index: int = 1,
    colormap: str = "grayscale",
    percentile_min: float = 2.0,
    percentile_max: float = 98.0
) -> Dict[str, Any]:
    """
    Renders a single band as normalized grayscale or with pseudo-coloring (Viridis, Magma, Ocean, Summer, Hot).
    """
    resolved = resolve_raster_path(path)
    data, _ = load_raster(resolved)
    bands_count = data.shape[0]

    if band_index < 1 or band_index > bands_count:
        raise ValueError(f"Requested band index {band_index} out of range (Raster has {bands_count} bands: 1 to {bands_count}).")

    raw_band = data[band_index - 1].astype(np.float32)
    b_min = float(np.min(raw_band))
    b_max = float(np.max(raw_band))
    b_mean = float(np.mean(raw_band))
    b_std = float(np.std(raw_band))

    # Radiometric contrast stretch
    p_low, p_high = np.percentile(raw_band, (percentile_min, percentile_max))
    if p_high > p_low:
        norm_band = np.clip((raw_band - p_low) / (p_high - p_low) * 255.0, 0, 255).astype(np.uint8)
    else:
        norm_band = cv2.normalize(raw_band, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    cmap_lower = colormap.lower()
    if cmap_lower == "viridis":
        colored = cv2.applyColorMap(norm_band, cv2.COLORMAP_VIRIDIS)
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    elif cmap_lower == "magma":
        colored = cv2.applyColorMap(norm_band, cv2.COLORMAP_MAGMA)
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    elif cmap_lower == "ocean":
        colored = cv2.applyColorMap(norm_band, cv2.COLORMAP_OCEAN)
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    elif cmap_lower == "summer":
        colored = cv2.applyColorMap(norm_band, cv2.COLORMAP_SUMMER)
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    elif cmap_lower == "hot":
        colored = cv2.applyColorMap(norm_band, cv2.COLORMAP_HOT)
        colored_rgb = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB)
    else:
        # Grayscale
        colored_rgb = norm_band

    _, preview_url = save_preview_image(colored_rgb, prefix=f"band_vis_{band_index}")

    # Compute 256-bin histogram
    hist, _ = np.histogram(norm_band.flatten(), bins=256, range=[0, 256])
    hist_data = HistogramData(
        bins=list(range(256)),
        counts_gray=[int(c) for c in hist]
    )

    return {
        "band_index": band_index,
        "band_name": f"Band {band_index}",
        "preview_url": preview_url,
        "colormap": colormap,
        "min_val": round(b_min, 2),
        "max_val": round(b_max, 2),
        "mean_val": round(b_mean, 2),
        "std_val": round(b_std, 2),
        "histogram": hist_data
    }
