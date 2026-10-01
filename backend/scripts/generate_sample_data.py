import os
import json
import numpy as np
import cv2

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_datasets")
os.makedirs(SAMPLE_DIR, exist_ok=True)

def generate_sample_satellite_scenes():
    h, w = 512, 512
    np.random.seed(42)

    # 1. Base terrain simulation (River, Forests, Crops, Urban, Barren)
    x = np.linspace(0, 10, w)
    y = np.linspace(0, 10, h)
    xx, yy = np.meshgrid(x, y)

    # River curve
    river_center = 4.5 + 1.2 * np.sin(yy * 0.8) + 0.3 * np.cos(yy * 2.0)
    river_mask = np.abs(xx - river_center) < 0.45

    # Dense Forest in Upper-Left
    forest_mask = (xx < 4.0) & (yy < 5.0) & ~river_mask

    # Agriculture Grid in Right/Center
    agri_mask = (xx > 5.5) & (yy < 7.0) & ~river_mask

    # Urban Core in Lower-Left for 2020
    urban_mask_2020 = (xx < 3.8) & (yy > 6.0) & ~river_mask

    # Urban Expansion for 2025 (Expanding into bare land and some farmland)
    urban_mask_2025 = ((xx < 5.0) & (yy > 5.2) & ~river_mask) | ((xx > 5.5) & (xx < 7.0) & (yy > 7.0) & ~river_mask)

    def create_rgb_scene(is_2025=False):
        img = np.zeros((h, w, 3), dtype=np.uint8)
        urban_m = urban_mask_2025 if is_2025 else urban_mask_2020

        # Background: Bare land / Soil (Brownish BGR: 60, 110, 150)
        img[:, :] = [55, 105, 145]
        noise = (np.random.randn(h, w) * 10).astype(np.int16)

        # Forest (Dark Green BGR: 30, 120, 40)
        img[forest_mask] = [35, 130, 45]

        # Agriculture (Lighter Green/Yellow BGR: 40, 180, 130)
        img[agri_mask] = [45, 175, 125]
        # Checkerboard crop pattern
        grid = (np.sin(xx * 5) > 0) ^ (np.sin(yy * 5) > 0)
        img[agri_mask & grid] = [30, 155, 95]

        # Urban (Gray / Concrete / Roofs BGR: 160, 150, 170)
        img[urban_m] = [160, 155, 175]
        # Roof variations
        roofs = (np.sin(xx * 15) > 0.4) & (np.sin(yy * 15) > 0.4)
        img[urban_m & roofs] = [100, 110, 200]

        # Water River (Deep Blue/Cyan BGR: 180, 120, 30)
        img[river_mask] = [190, 125, 25]

        # Add texture noise
        for c in range(3):
            ch = img[:, :, c].astype(np.int16) + noise
            img[:, :, c] = np.clip(ch, 0, 255).astype(np.uint8)

        return img

    scene_2020 = create_rgb_scene(is_2025=False)
    scene_2025 = create_rgb_scene(is_2025=True)

    cv2.imwrite(os.path.join(SAMPLE_DIR, "scene_2020_t1.png"), scene_2020)
    cv2.imwrite(os.path.join(SAMPLE_DIR, "scene_2025_t2.png"), scene_2025)

    # 2. Multispectral Bands (NIR, Red, Green, SWIR)
    # NIR: Very bright in vegetation & agriculture, dark in water
    nir_band = np.zeros((h, w), dtype=np.uint8)
    nir_band[:] = 80 # Bare land
    nir_band[forest_mask] = 230 # High NIR reflectance
    nir_band[agri_mask] = 190
    nir_band[urban_mask_2020] = 70
    nir_band[river_mask] = 10 # High water absorption

    # Red: High in bare land and urban, low in vegetation
    red_band = np.zeros((h, w), dtype=np.uint8)
    red_band[:] = 140
    red_band[forest_mask] = 30 # Chlorophyll absorption
    red_band[agri_mask] = 50
    red_band[urban_mask_2020] = 160
    red_band[river_mask] = 25

    # Green: Moderate in vegetation, high in water
    green_band = np.zeros((h, w), dtype=np.uint8)
    green_band[:] = 100
    green_band[forest_mask] = 120
    green_band[agri_mask] = 140
    green_band[urban_mask_2020] = 150
    green_band[river_mask] = 110

    # SWIR: High in urban and dry soil, low in vegetation & water
    swir_band = np.zeros((h, w), dtype=np.uint8)
    swir_band[:] = 170
    swir_band[forest_mask] = 40
    swir_band[agri_mask] = 60
    swir_band[urban_mask_2020] = 220
    swir_band[river_mask] = 15

    cv2.imwrite(os.path.join(SAMPLE_DIR, "band_nir.png"), nir_band)
    cv2.imwrite(os.path.join(SAMPLE_DIR, "band_red.png"), red_band)
    cv2.imwrite(os.path.join(SAMPLE_DIR, "band_green.png"), green_band)
    cv2.imwrite(os.path.join(SAMPLE_DIR, "band_swir.png"), swir_band)

    # 3. GeoJSON Study Area Polygon (e.g. Hyderabad / Silicon Valley GIS test area)
    study_area_geojson = {
        "type": "FeatureCollection",
        "name": "GeoVision_Study_Area_T1_T2",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "site_id": "RS_SITE_001",
                    "site_name": "GeoVision Lake & River Basin Study Area",
                    "sensor": "Sentinel-2 MSI",
                    "spatial_resolution_m": 10.0,
                    "crs": "EPSG:4326",
                    "acquisition_t1": "2020-03-15",
                    "acquisition_t2": "2025-03-18",
                    "is_sample_data": True
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [78.4350, 17.4120],
                            [78.4862, 17.4120],
                            [78.4862, 17.4632],
                            [78.4350, 17.4632],
                            [78.4350, 17.4120]
                        ]
                    ]
                }
            }
        ]
    }

    with open(os.path.join(SAMPLE_DIR, "study_area_boundary.geojson"), "w", encoding="utf-8") as f:
        json.dump(study_area_geojson, f, indent=2)

    print("Sample satellite dataset and GeoJSON boundary generated successfully.")

if __name__ == "__main__":
    generate_sample_satellite_scenes()
