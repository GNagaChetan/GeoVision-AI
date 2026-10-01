import os
import uuid
import numpy as np
import cv2
from typing import Dict, Any, List, Tuple, Optional
from app.core.config import settings
from app.models.schemas import (
    LULCClassMetric,
    LULCClassificationResponse,
    LULCTemporalComparisonResponse
)

# Standard 5 LULC Classes Definitions
LULC_CLASSES = [
    {"id": 0, "name": "Vegetation", "color": "#10b981", "bgr": (129, 185, 16)},
    {"id": 1, "name": "Water", "color": "#06b6d4", "bgr": (212, 182, 6)},
    {"id": 2, "name": "Built-up", "color": "#f43f5e", "bgr": (94, 63, 244)},
    {"id": 3, "name": "Agriculture", "color": "#f59e0b", "bgr": (11, 158, 245)},
    {"id": 4, "name": "Bare land", "color": "#a16207", "bgr": (7, 98, 161)},
]

class LULCService:
    """
    Land Use Land Cover (LULC) Classification & Temporal Change Detection Engine.
    Implements rule-based spectral classification and pixel-level transition matrix analytics.
    """

    @staticmethod
    def classify_image_spectral(img_bgr: np.ndarray, pixel_res_meters: float = 10.0) -> Tuple[np.ndarray, List[LULCClassMetric]]:
        """
        Classify multi-band / RGB image into 5 standard LULC classes using spectral indices & color spaces.
        """
        h, w = img_bgr.shape[:2]
        total_pixels = h * w
        pixel_area_m2 = pixel_res_meters * pixel_res_meters
        pixel_area_ha = pixel_area_m2 / 10000.0

        # Convert to HSV and LAB color spaces for robust spectral separation
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
        
        b = img_bgr[:, :, 0].astype(np.float32)
        g = img_bgr[:, :, 1].astype(np.float32)
        r = img_bgr[:, :, 2].astype(np.float32)

        # Approximate Green-Red Vegetation Index: (G - R) / (G + R + eps)
        grvi = (g - r) / (g + r + 1e-6)
        
        # Classification Map (0 to 4)
        class_map = np.zeros((h, w), dtype=np.uint8)

        # 1. Water: High blue/cyan, low red/green, high saturation in blue or low value
        water_mask = ((b > r + 10) & (b > g)) | ((v_ch < 60) & (b > 50))
        class_map[water_mask] = 1

        # 2. Vegetation (Dense): High GRVI, Green dominant, moderate-high saturation
        veg_mask = (grvi > 0.15) & (g > r) & (g > b) & (v_ch > 50) & ~water_mask
        class_map[veg_mask] = 0

        # 3. Agriculture (Crops/Farmland): Moderate GRVI or yellowish green, high value
        agri_mask = (grvi >= 0.0) & (grvi <= 0.15) & (h_ch >= 20) & (h_ch <= 70) & (s_ch > 50) & ~water_mask & ~veg_mask
        class_map[agri_mask] = 3

        # 4. Built-up (Impervious / Concrete / Roofs): Low saturation, high brightness or reddish/gray tones
        built_mask = (((s_ch < 50) & (v_ch > 100) & (np.abs(r - g) < 25)) | ((r > g + 25) & (r > b + 25))) & ~water_mask & ~veg_mask & ~agri_mask
        class_map[built_mask] = 2

        # 5. Bare Land (Soil, Sand, Barren): Remaining unclassified / low vegetation index
        bare_mask = (class_map == 0) & (grvi <= 0.0) & ~water_mask
        class_map[bare_mask] = 4

        # Calculate exact metrics per class
        class_metrics = []
        for cls in LULC_CLASSES:
            cid = cls["id"]
            count = int(np.sum(class_map == cid))
            ha = round(count * pixel_area_ha, 3)
            km2 = round(ha / 100.0, 4)
            pct = round((count / total_pixels) * 100.0, 2)

            class_metrics.append(LULCClassMetric(
                class_id=cid,
                class_name=cls["name"],
                color_hex=cls["color"],
                pixel_count=count,
                area_hectares=ha,
                area_sq_km=km2,
                percentage=pct
            ))

        return class_map, class_metrics

    @staticmethod
    def render_lulc_map(class_map: np.ndarray) -> Tuple[str, str]:
        """Render RGB visualization of LULC classification map."""
        h, w = class_map.shape
        color_img = np.zeros((h, w, 3), dtype=np.uint8)
        for cls in LULC_CLASSES:
            mask = (class_map == cls["id"])
            color_img[mask] = cls["bgr"]

        filename = f"lulc_{uuid.uuid4().hex[:8]}.png"
        abs_path = os.path.join(settings.PROCESSED_DIR, filename)
        cv2.imwrite(abs_path, color_img)
        return abs_path, f"/api/v1/processed/{filename}"

    def process_dataset_lulc(self, image_path: str, dataset_name: str = "Scene Analysis", res_m: float = 10.0) -> LULCClassificationResponse:
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Image not found at {image_path}")

        class_map, metrics = self.classify_image_spectral(img, res_m)
        _, map_url = self.render_lulc_map(class_map)

        total_ha = sum(m.area_hectares for m in metrics)
        total_km2 = sum(m.area_sq_km for m in metrics)

        return LULCClassificationResponse(
            dataset_name=dataset_name,
            total_area_hectares=round(total_ha, 3),
            total_area_sq_km=round(total_km2, 4),
            classes=metrics,
            classification_map_url=map_url,
            method_used="Spectral Index & Multi-Space Decision Tree Classification"
        )

    def compare_temporal_scenes(
        self,
        t1_path: str,
        t2_path: str,
        t1_name: str = "2020 (T1)",
        t2_name: str = "2025 (T2)",
        res_m: float = 10.0
    ) -> LULCTemporalComparisonResponse:
        """
        Compute pixel-accurate temporal change detection and NxN transition matrix between T1 and T2.
        """
        img1 = cv2.imread(t1_path)
        img2 = cv2.imread(t2_path)

        if img1 is None or img2 is None:
            raise FileNotFoundError("Could not load T1 or T2 image files.")

        # Ensure spatial alignment
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))

        class_map1, metrics1 = self.classify_image_spectral(img1, res_m)
        class_map2, metrics2 = self.classify_image_spectral(img2, res_m)

        num_classes = len(LULC_CLASSES)
        transition_matrix = np.zeros((num_classes, num_classes), dtype=np.float64)
        pixel_area_ha = (res_m * res_m) / 10000.0

        for i in range(num_classes):
            for j in range(num_classes):
                # Count pixels that were class i at T1 and became class j at T2
                count = np.sum((class_map1 == i) & (class_map2 == j))
                transition_matrix[i, j] = round(count * pixel_area_ha, 3)

        # Compute net class changes
        class_changes = []
        for i in range(num_classes):
            c_name = LULC_CLASSES[i]["name"]
            t1_ha = metrics1[i].area_hectares
            t2_ha = metrics2[i].area_hectares
            change_ha = round(t2_ha - t1_ha, 3)
            change_pct = round(((t2_ha - t1_ha) / (t1_ha + 1e-6)) * 100.0, 2)

            class_changes.append({
                "class_id": i,
                "class_name": c_name,
                "color_hex": LULC_CLASSES[i]["color"],
                "t1_ha": t1_ha,
                "t2_ha": t2_ha,
                "change_ha": change_ha,
                "change_pct": change_pct
            })

        # Render Change Difference Map (Red for built expansion/vegetation loss, Green for vegetation gain, Blue for water shift)
        h, w = class_map1.shape
        diff_img = np.zeros((h, w, 3), dtype=np.uint8)
        # Unchanged areas: light gray
        diff_img[class_map1 == class_map2] = (220, 220, 220)
        # Built-up expansion (Vegetation/Agri -> Built-up): Bright Red
        diff_img[(class_map1 != 2) & (class_map2 == 2)] = (50, 50, 240)
        # Vegetation Gain (Any -> Vegetation): Bright Green
        diff_img[(class_map1 != 0) & (class_map2 == 0)] = (50, 220, 50)
        # Vegetation Loss (Vegetation -> Any other): Amber/Orange
        diff_img[(class_map1 == 0) & (class_map2 != 0)] = (30, 150, 240)

        filename = f"change_{uuid.uuid4().hex[:8]}.png"
        abs_path = os.path.join(settings.PROCESSED_DIR, filename)
        cv2.imwrite(abs_path, diff_img)
        diff_url = f"/api/v1/processed/{filename}"

        total_ha = sum(m.area_hectares for m in metrics1)
        transition_labels = [c["name"] for c in LULC_CLASSES]

        return LULCTemporalComparisonResponse(
            t1_timestamp=t1_name,
            t2_timestamp=t2_name,
            total_area_ha=round(total_ha, 3),
            t1_classes=metrics1,
            t2_classes=metrics2,
            class_changes=class_changes,
            transition_matrix=transition_matrix.tolist(),
            transition_labels=transition_labels,
            change_map_url=diff_url
        )

lulc_service = LULCService()
