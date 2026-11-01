import os
import uuid
import numpy as np
import cv2
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from app.core.config import settings
from app.models.schemas import (
    LULCClassDefinition,
    LULCClassMetric,
    LULCClassificationResponse,
    LULCValidationResponse
)

# Standard 5 LULC Classes Definitions (Extensible)
DEFAULT_LULC_CLASSES = [
    {"id": 0, "name": "Vegetation", "color": "#10b981", "bgr": (129, 185, 16), "description": "Forests, urban greenery, tree cover"},
    {"id": 1, "name": "Water", "color": "#06b6d4", "bgr": (212, 182, 6), "description": "Rivers, lakes, reservoirs, water bodies"},
    {"id": 2, "name": "Built-up", "color": "#f43f5e", "bgr": (94, 63, 244), "description": "Urban concrete, buildings, roads, infrastructure"},
    {"id": 3, "name": "Agriculture", "color": "#f59e0b", "bgr": (11, 158, 245), "description": "Cultivated cropland, farmland, vegetation patches"},
    {"id": 4, "name": "Bare Land", "color": "#a16207", "bgr": (7, 98, 161), "description": "Exposed soil, sand, barren land, rock"},
]

class LULCService:
    """
    Land Use / Land Cover (LULC) Analysis Engine.
    Supports rule-based spectral classification, pre-classified raster ingestion,
    class distribution analytics, area/percentage computation, and statistical export.
    """

    def __init__(self):
        self.default_classes = DEFAULT_LULC_CLASSES

    def validate_lulc_raster(self, raster_path: str) -> LULCValidationResponse:
        """
        Validate input raster file for LULC analysis.
        """
        if not os.path.exists(raster_path):
            raise FileNotFoundError(f"Raster file not found at {raster_path}")

        img = cv2.imread(raster_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError("Unsupported or corrupted raster image format.")

        h, w = img.shape[:2]
        total_pixels = h * w

        if len(img.shape) == 2:
            # Single-band classified raster
            unique_vals = [int(v) for v in np.unique(img)]
            valid = all(0 <= v <= 20 for v in unique_vals)
            msg = "Valid single-band pre-classified raster." if valid else "Pixel values exceed standard classification indices."
        else:
            # Multi-channel RGB/Multispectral
            unique_vals = []
            valid = True
            msg = f"Multi-channel raster ({img.shape[2]} channels) ready for spectral decision-tree classification."

        return LULCValidationResponse(
            is_valid=valid,
            unique_classes=unique_vals,
            width=w,
            height=h,
            total_pixels=total_pixels,
            message=msg
        )

    def classify_image_spectral(
        self,
        img_bgr: np.ndarray,
        pixel_res_meters: float = 10.0,
        custom_classes: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[np.ndarray, List[LULCClassMetric], str]:
        """
        Classify RGB / multi-band image into standard LULC classes using spectral indices.
        """
        h, w = img_bgr.shape[:2]
        total_pixels = h * w
        pixel_area_m2 = pixel_res_meters * pixel_res_meters
        pixel_area_ha = pixel_area_m2 / 10000.0

        classes_to_use = custom_classes or self.default_classes

        # Color Space Analysis for Robust Separation
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

        b = img_bgr[:, :, 0].astype(np.float32)
        g = img_bgr[:, :, 1].astype(np.float32)
        r = img_bgr[:, :, 2].astype(np.float32)

        # Green-Red Vegetation Index: (G - R) / (G + R + eps)
        grvi = (g - r) / (g + r + 1e-6)

        class_map = np.zeros((h, w), dtype=np.uint8)

        # 1. Water: High blue/cyan, low red/green, high saturation in blue
        water_mask = ((b > r + 10) & (b > g)) | ((v_ch < 60) & (b > 50))
        class_map[water_mask] = 1

        # 2. Vegetation (Dense): High GRVI, Green dominant, high saturation
        veg_mask = (grvi > 0.15) & (g > r) & (g > b) & (v_ch > 50) & ~water_mask
        class_map[veg_mask] = 0

        # 3. Agriculture (Crops/Farmland): Moderate GRVI, yellowish green, high value
        agri_mask = (grvi >= 0.0) & (grvi <= 0.15) & (h_ch >= 20) & (h_ch <= 70) & (s_ch > 50) & ~water_mask & ~veg_mask
        class_map[agri_mask] = 3

        # 4. Built-up (Impervious / Concrete / Roofs): Low saturation, high brightness or reddish/gray tones
        built_mask = (((s_ch < 50) & (v_ch > 100) & (np.abs(r - g) < 25)) | ((r > g + 25) & (r > b + 25))) & ~water_mask & ~veg_mask & ~agri_mask
        class_map[built_mask] = 2

        # 5. Bare Land (Soil, Sand, Barren): Low vegetation index, remaining pixels
        bare_mask = (class_map == 0) & (grvi <= 0.0) & ~water_mask
        class_map[bare_mask] = 4

        # Calculate exact metrics per class
        class_metrics = []
        max_count = -1
        dominant_class = "Vegetation"

        for cls in classes_to_use:
            cid = cls["id"]
            count = int(np.sum(class_map == cid))
            ha = round(count * pixel_area_ha, 3)
            km2 = round(ha / 100.0, 4)
            pct = round((count / total_pixels) * 100.0, 2)

            if count > max_count:
                max_count = count
                dominant_class = cls["name"]

            class_metrics.append(LULCClassMetric(
                class_id=cid,
                class_name=cls["name"],
                color_hex=cls["color"],
                pixel_count=count,
                area_hectares=ha,
                area_sq_km=km2,
                percentage=pct
            ))

        return class_map, class_metrics, dominant_class

    def render_lulc_map(self, class_map: np.ndarray, classes: Optional[List[Dict[str, Any]]] = None) -> Tuple[str, str]:
        """Render RGB colormapped PNG visualization of LULC classification map."""
        h, w = class_map.shape
        color_img = np.zeros((h, w, 3), dtype=np.uint8)
        classes_to_use = classes or self.default_classes

        for cls in classes_to_use:
            mask = (class_map == cls["id"])
            color_img[mask] = cls.get("bgr", (128, 128, 128))

        filename = f"lulc_{uuid.uuid4().hex[:8]}.png"
        abs_path = os.path.join(settings.PROCESSED_DIR, filename)
        cv2.imwrite(abs_path, color_img)
        return abs_path, f"/api/v1/processed/{filename}"

    def process_dataset_lulc(
        self,
        image_path: str,
        dataset_name: str = "Scene Analysis",
        res_m: float = 10.0,
        is_demo: bool = False
    ) -> LULCClassificationResponse:
        """
        Full LULC classification pipeline with area metrics, percentage distribution, and legend.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Image not found at {image_path}")

        class_map, metrics, dominant_class = self.classify_image_spectral(img, res_m)
        _, map_url = self.render_lulc_map(class_map)

        total_ha = sum(m.area_hectares for m in metrics)
        total_km2 = sum(m.area_sq_km for m in metrics)

        legend = [
            {
                "class_id": c["id"],
                "class_name": c["name"],
                "color_hex": c["color"],
                "description": c.get("description", "")
            }
            for c in self.default_classes
        ]

        return LULCClassificationResponse(
            dataset_name=dataset_name,
            total_area_hectares=round(total_ha, 3),
            total_area_sq_km=round(total_km2, 4),
            dominant_class=dominant_class,
            classes=metrics,
            classification_map_url=map_url,
            legend=legend,
            method_used="Spectral Index & Decision Tree Multi-Space Classification",
            is_demo_data=is_demo
        )

    def compare_temporal_scenes(
        self,
        t1_path: str,
        t2_path: str,
        t1_name: str = "2020 (Baseline)",
        t2_name: str = "2025 (Recent)",
        res_m: float = 10.0
    ):
        """Compare two temporal scenes using multi-date change detection."""
        from app.services.change_detection_service import change_detection_service
        return change_detection_service.compute_change_detection(
            t1_path=t1_path,
            t2_path=t2_path,
            t1_name=t1_name,
            t2_name=t2_name,
            pixel_res_meters=res_m
        )

    def export_statistics_csv(self, metrics: List[LULCClassMetric]) -> str:
        """Generate formatted CSV string of LULC class statistics."""
        data = [
            {
                "Class ID": m.class_id,
                "Class Name": m.class_name,
                "Pixel Count": m.pixel_count,
                "Area (Hectares)": m.area_hectares,
                "Area (Sq Km)": m.area_sq_km,
                "Percentage (%)": m.percentage
            }
            for m in metrics
        ]
        df = pd.DataFrame(data)
        return df.to_csv(index=False)

lulc_service = LULCService()
