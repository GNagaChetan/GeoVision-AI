import numpy as np
import cv2
from typing import Dict, Any, Optional, Tuple
from .raster_io import load_raster, save_preview_image, resolve_raster_path
from .metadata import extract_raster_metadata

def _stretch_channel(ch: np.ndarray, p_low: float = 2.0, p_high: float = 98.0) -> np.ndarray:
    """Percentile normalization for a single spectral band."""
    c_f = ch.astype(np.float32)
    low, high = np.percentile(c_f, (p_low, p_high))
    if high > low:
        stretched = np.clip((c_f - low) / (high - low) * 255.0, 0, 255).astype(np.uint8)
    else:
        stretched = cv2.normalize(ch, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return stretched

def create_rgb_composite(
    path: str,
    r_idx: int = 1,
    g_idx: int = 2,
    b_idx: int = 3,
    percentile_stretch: bool = True
) -> Dict[str, Any]:
    """
    Creates custom RGB Composite from user-assigned band indices (1-indexed).
    """
    resolved = resolve_raster_path(path)
    data, _ = load_raster(resolved)
    total_bands = data.shape[0]

    for name, idx in [("Red", r_idx), ("Green", g_idx), ("Blue", b_idx)]:
        if idx < 1 or idx > total_bands:
            raise ValueError(f"Requested {name} channel (Band {idx}) is out of range. Raster contains {total_bands} bands.")

    r_band = data[r_idx - 1]
    g_band = data[g_idx - 1]
    b_band = data[b_idx - 1]

    if percentile_stretch:
        r_norm = _stretch_channel(r_band)
        g_norm = _stretch_channel(g_band)
        b_norm = _stretch_channel(b_band)
    else:
        r_norm = cv2.normalize(r_band, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        g_norm = cv2.normalize(g_band, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        b_norm = cv2.normalize(b_band, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    rgb_stack = np.stack([r_norm, g_norm, b_norm], axis=2) # (H, W, 3)
    _, url = save_preview_image(rgb_stack, prefix="rgb_comp")

    return {
        "success": True,
        "composite_url": url,
        "bands_mapped": {"R": r_idx, "G": g_idx, "B": b_idx},
        "description": f"RGB Composite mapped with R=Band {r_idx}, G=Band {g_idx}, B=Band {b_idx}."
    }

def create_false_color_composite(
    path: str,
    preset: str = "Color_Infrared",
    custom_r: Optional[int] = None,
    custom_g: Optional[int] = None,
    custom_b: Optional[int] = None
) -> Dict[str, Any]:
    """
    Creates False Color Composite according to satellite remote sensing standards.
    Strictly validates band existence and returns clear guidance if required bands are unavailable.
    """
    resolved = resolve_raster_path(path)
    data, _ = load_raster(resolved)
    meta = extract_raster_metadata(resolved)
    total_bands = data.shape[0]

    preset_clean = preset.strip()

    # Preset band mappings:
    # 1. Color_Infrared (CIR / Standard FCC): R=NIR, G=Red, B=Green
    # 2. Agriculture: R=SWIR1, G=NIR, B=Blue
    # 3. Urban_SWIR: R=SWIR2, G=SWIR1, B=Red
    # 4. Atmospheric_Penetration: R=SWIR2, G=SWIR1, B=NIR

    if custom_r and custom_g and custom_b:
        r_idx, g_idx, b_idx = custom_r, custom_g, custom_b
        rationale = f"Custom False Color mapping: R=Band {r_idx}, G=Band {g_idx}, B=Band {b_idx}."
    elif preset_clean in ["Color_Infrared", "Standard_FCC", "CIR"]:
        # Needs NIR, Red, Green
        if total_bands >= 4:
            # Sentinel-2 stack: 1=Blue, 2=Green, 3=Red, 4=NIR
            r_idx, g_idx, b_idx = 4, 3, 2
            rationale = "Color Infrared (CIR): Near-Infrared (NIR) assigned to Red channel renders healthy vegetation in vibrant scarlet/red, while water absorbs NIR appearing dark."
        else:
            return {
                "success": False,
                "composite_url": "",
                "preset_used": preset_clean,
                "bands_used": {},
                "required_bands_present": False,
                "academic_rationale": "Color Infrared (CIR) composite requires Near-Infrared (NIR, ~830nm) along with Red and Green bands.",
                "message": f"Cannot generate Color Infrared composite: Uploaded raster contains only {total_bands} bands without an available Near-Infrared (NIR) channel. Minimum 4 spectral bands required."
            }

    elif preset_clean in ["Agriculture", "Agri"]:
        # Needs SWIR1, NIR, Blue
        if total_bands >= 5:
            # Sentinel-2: 5=SWIR1, 4=NIR, 1=Blue
            r_idx, g_idx, b_idx = 5, 4, 1
            rationale = "Agriculture Composite: SWIR-1 assigned to Red, NIR to Green, and Blue to Blue. Highlights crop vigor and soil moisture variations."
        else:
            return {
                "success": False,
                "composite_url": "",
                "preset_used": preset_clean,
                "bands_used": {},
                "required_bands_present": False,
                "academic_rationale": "Agriculture composite requires Shortwave-Infrared (SWIR-1, ~1610nm), Near-Infrared (NIR), and Blue bands.",
                "message": f"Cannot generate Agriculture composite: Uploaded raster contains {total_bands} bands and lacks SWIR-1. Minimum 5 spectral bands required."
            }

    elif preset_clean in ["Urban_SWIR", "Urban"]:
        # Needs SWIR2, SWIR1, Red
        if total_bands >= 6:
            r_idx, g_idx, b_idx = 6, 5, 3
            rationale = "Urban SWIR Composite: SWIR-2, SWIR-1, and Red combination penetrates atmospheric haze and clearly delineates built-up impervious concrete structures from bare soil."
        elif total_bands == 5:
            r_idx, g_idx, b_idx = 5, 4, 3
            rationale = "Urban SWIR Composite (Adapted): SWIR-1, NIR, and Red combination highlighting urban density."
        else:
            return {
                "success": False,
                "composite_url": "",
                "preset_used": preset_clean,
                "bands_used": {},
                "required_bands_present": False,
                "academic_rationale": "Urban SWIR composite requires Shortwave-Infrared (SWIR) and Red bands.",
                "message": f"Cannot generate Urban SWIR composite: Uploaded raster has only {total_bands} bands and lacks SWIR channels."
            }

    elif preset_clean in ["Atmospheric_Penetration", "Haze_Penetration"]:
        if total_bands >= 5:
            r_idx, g_idx, b_idx = 5, 4, 3
            rationale = "Atmospheric Penetration: Utilizes longer infrared wavelengths to cut through smoke, thin cloud haze, and dust aerosols."
        else:
            return {
                "success": False,
                "composite_url": "",
                "preset_used": preset_clean,
                "bands_used": {},
                "required_bands_present": False,
                "academic_rationale": "Atmospheric penetration composite requires multi-spectral infrared bands.",
                "message": f"Cannot generate composite: Multi-spectral infrared bands unavailable in {total_bands}-band raster."
            }
    else:
        # Default fallback to top 3 bands
        r_idx, g_idx, b_idx = min(1, total_bands), min(2, total_bands), min(3, total_bands)
        rationale = f"Default 3-band false color assignment on bands ({r_idx}, {g_idx}, {b_idx})."

    # Validate indices
    for name, idx in [("Red", r_idx), ("Green", g_idx), ("Blue", b_idx)]:
        if idx < 1 or idx > total_bands:
            return {
                "success": False,
                "composite_url": "",
                "preset_used": preset_clean,
                "bands_used": {},
                "required_bands_present": False,
                "academic_rationale": rationale,
                "message": f"Assigned {name} channel (Band {idx}) is outside raster range (1-{total_bands})."
            }

    r_norm = _stretch_channel(data[r_idx - 1])
    g_norm = _stretch_channel(data[g_idx - 1])
    b_norm = _stretch_channel(data[b_idx - 1])

    fcc_stack = np.stack([r_norm, g_norm, b_norm], axis=2)
    _, url = save_preview_image(fcc_stack, prefix=f"fcc_{preset_clean.lower()}")

    return {
        "success": True,
        "composite_url": url,
        "preset_used": preset_clean,
        "bands_used": {"R": r_idx, "G": g_idx, "B": b_idx},
        "required_bands_present": True,
        "academic_rationale": rationale,
        "message": None
    }
