import os
import sys
import numpy as np
import cv2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def generate_sample_geotiffs():
    os.makedirs(settings.SAMPLE_DATA_DIR, exist_ok=True)
    
    # 1. Load baseline synthetic bands if available
    b_red_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_red.png")
    b_grn_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_green.png")
    b_nir_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_nir.png")
    b_swr_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_swir.png")

    if os.path.exists(b_red_p):
        red = cv2.imread(b_red_p, cv2.IMREAD_GRAYSCALE)
    else:
        red = np.random.randint(40, 160, (512, 512), dtype=np.uint8)

    if os.path.exists(b_grn_p):
        green = cv2.imread(b_grn_p, cv2.IMREAD_GRAYSCALE)
    else:
        green = np.random.randint(50, 180, (512, 512), dtype=np.uint8)

    if os.path.exists(b_nir_p):
        nir = cv2.imread(b_nir_p, cv2.IMREAD_GRAYSCALE)
    else:
        nir = np.random.randint(80, 240, (512, 512), dtype=np.uint8)

    if os.path.exists(b_swr_p):
        swir = cv2.imread(b_swr_p, cv2.IMREAD_GRAYSCALE)
    else:
        swir = np.random.randint(30, 140, (512, 512), dtype=np.uint8)

    # Synthetic Blue band
    blue = np.clip(green.astype(np.int16) - 15, 20, 255).astype(np.uint8)
    # Synthetic SWIR2 band
    swir2 = np.clip(swir.astype(np.int16) + 20, 10, 255).astype(np.uint8)

    try:
        import rasterio
        from rasterio.transform import from_origin

        # 1. Sentinel-2 5-Band GeoTIFF (EPSG:32643)
        s2_path = os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif")
        transform_s2 = from_origin(500000.0, 3100000.0, 10.0, 10.0)
        with rasterio.open(
            s2_path,
            'w',
            driver='GTiff',
            height=512,
            width=512,
            count=5,
            dtype=np.uint8,
            crs='EPSG:32643',
            transform=transform_s2,
        ) as dst:
            dst.write(blue, 1)
            dst.write(green, 2)
            dst.write(red, 3)
            dst.write(nir, 4)
            dst.write(swir, 5)
            dst.update_tags(
                platform="Sentinel-2A",
                sensor="MSI",
                acquisition_date="2024-04-12T05:45:00Z",
                bands='["B02-Blue", "B03-Green", "B04-Red", "B08-NIR", "B11-SWIR1"]'
            )
            dst.set_band_description(1, "Blue (B02 - 490nm)")
            dst.set_band_description(2, "Green (B03 - 560nm)")
            dst.set_band_description(3, "Red (B04 - 665nm)")
            dst.set_band_description(4, "NIR (B08 - 842nm)")
            dst.set_band_description(5, "SWIR1 (B11 - 1610nm)")
        print(f"Generated Sentinel-2 GeoTIFF via Rasterio: {s2_path}")

        # 2. Landsat-9 6-Band GeoTIFF (EPSG:32643)
        l9_path = os.path.join(settings.SAMPLE_DATA_DIR, "landsat9_multispectral_sample.tif")
        transform_l9 = from_origin(500000.0, 3100000.0, 30.0, 30.0)
        with rasterio.open(
            l9_path,
            'w',
            driver='GTiff',
            height=512,
            width=512,
            count=6,
            dtype=np.uint8,
            crs='EPSG:32643',
            transform=transform_l9,
        ) as dst:
            dst.write(blue, 1)
            dst.write(green, 2)
            dst.write(red, 3)
            dst.write(nir, 4)
            dst.write(swir, 5)
            dst.write(swir2, 6)
            dst.update_tags(
                platform="Landsat-9",
                sensor="OLI-2/TIRS-2",
                acquisition_date="2024-05-02T10:15:00Z",
                bands='["B2-Blue", "B3-Green", "B4-Red", "B5-NIR", "B6-SWIR1", "B7-SWIR2"]'
            )
        print(f"Generated Landsat-9 GeoTIFF via Rasterio: {l9_path}")

        # 3. 3-Band Natural Color RGB GeoTIFF (EPSG:4326)
        rgb_path = os.path.join(settings.SAMPLE_DATA_DIR, "rgb_aerial_sample.tif")
        transform_rgb = from_origin(77.1025, 28.7041, 0.0001, 0.0001)
        with rasterio.open(
            rgb_path,
            'w',
            driver='GTiff',
            height=512,
            width=512,
            count=3,
            dtype=np.uint8,
            crs='EPSG:4326',
            transform=transform_rgb,
        ) as dst:
            dst.write(red, 1)
            dst.write(green, 2)
            dst.write(blue, 3)
            dst.update_tags(
                platform="High-Res Aerial Ortho",
                sensor="RGB Optical",
                acquisition_date="2024-06-10T12:00:00Z",
                bands='["Red", "Green", "Blue"]'
            )
        print(f"Generated RGB Aerial GeoTIFF via Rasterio: {rgb_path}")

    except Exception as e:
        print(f"Notice: Rasterio generation error: {e}, using tifffile fallback.")
        import tifffile
        s2_data = np.stack([blue, green, red, nir, swir], axis=0)
        s2_path = os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif")
        tifffile.imwrite(s2_path, s2_data)

if __name__ == "__main__":
    generate_sample_geotiffs()
