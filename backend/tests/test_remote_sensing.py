import os
import sys
import json
import pytest
import numpy as np
import cv2
import tifffile
from io import BytesIO
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.core.config import settings
from app.services.remote_sensing import (
    RemoteSensingService,
    rs_service,
    load_raster,
    validate_raster,
    extract_raster_metadata,
    inspect_bands,
    visualize_single_band,
    create_rgb_composite,
    create_false_color_composite,
    compute_spectral_index,
    create_study_area_project,
    list_study_area_projects,
    validate_and_describe_crs,
    reproject_bounds_to_wgs84
)

client = TestClient(app)

@pytest.fixture
def sentinel2_geotiff_path():
    p = os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif")
    assert os.path.exists(p), f"Sentinel-2 sample GeoTIFF not found at {p}"
    return p

@pytest.fixture
def rgb_geotiff_path():
    p = os.path.join(settings.SAMPLE_DATA_DIR, "rgb_aerial_sample.tif")
    assert os.path.exists(p), f"RGB sample GeoTIFF not found at {p}"
    return p

# =====================================================================
# 1. Raster IO & Validation Tests
# =====================================================================
def test_load_and_validate_geotiff(sentinel2_geotiff_path):
    data, meta = load_raster(sentinel2_geotiff_path)
    assert data.ndim == 3
    assert data.shape[0] == 5 # 5 bands
    assert data.shape[1] == 512
    assert data.shape[2] == 512

    val = validate_raster(sentinel2_geotiff_path)
    assert val["is_valid"] is True
    assert val["band_count"] == 5
    assert val["has_georeferencing"] is True

def test_validate_invalid_file():
    val = validate_raster("non_existent_file_path.tif")
    assert val["is_valid"] is False

# =====================================================================
# 2. Metadata Extraction & CRS Tests
# =====================================================================
def test_extract_geotiff_metadata(sentinel2_geotiff_path):
    meta = extract_raster_metadata(sentinel2_geotiff_path)
    assert meta["format"] == "GeoTIFF"
    assert meta["band_count"] == 5
    assert meta["width"] == 512
    assert meta["height"] == 512
    assert "EPSG:32643" in meta["crs"]
    assert meta["is_projected"] is True
    assert len(meta["bands"]) == 5
    assert meta["bands"][0]["name"].startswith("Band 1")
    assert len(meta["bounds_wgs84"]) == 4
    assert meta["geographic_extent"]["type"] == "Polygon"

def test_crs_validator():
    crs_proj = validate_and_describe_crs("EPSG:32643")
    assert crs_proj["is_valid"] is True
    assert crs_proj["is_projected"] is True
    assert "metre" in crs_proj["units"].lower()

    crs_geo = validate_and_describe_crs("EPSG:4326")
    assert crs_geo["is_valid"] is True
    assert crs_geo["is_geographic"] is True

    bounds_wgs84, center = reproject_bounds_to_wgs84([500000.0, 3100000.0, 505120.0, 3105120.0], src_crs="EPSG:32643")
    assert len(bounds_wgs84) == 4
    assert len(center) == 2

# =====================================================================
# 3. Band Inspection & Visualization Tests
# =====================================================================
def test_band_inspection(sentinel2_geotiff_path):
    bands = inspect_bands(sentinel2_geotiff_path)
    assert len(bands) == 5
    for b in bands:
        assert "band_index" in b
        assert "preview_url" in b
        assert b["min_val"] <= b["max_val"]

def test_visualize_single_band(sentinel2_geotiff_path):
    res_gray = visualize_single_band(sentinel2_geotiff_path, band_index=4, colormap="grayscale")
    assert res_gray["band_index"] == 4
    assert res_gray["preview_url"].startswith("/api/v1/processed/")
    assert len(res_gray["histogram"].bins) == 256

    res_viridis = visualize_single_band(sentinel2_geotiff_path, band_index=2, colormap="viridis")
    assert res_viridis["colormap"] == "viridis"

# =====================================================================
# 4. True-Color and False-Color Composites Tests
# =====================================================================
def test_rgb_composite(sentinel2_geotiff_path):
    # Sentinel-2 stack: R=Band 3 (Red), G=Band 2 (Green), B=Band 1 (Blue)
    comp = create_rgb_composite(sentinel2_geotiff_path, r_idx=3, g_idx=2, b_idx=1)
    assert comp["success"] is True
    assert comp["composite_url"].startswith("/api/v1/processed/")
    assert comp["bands_mapped"] == {"R": 3, "G": 2, "B": 1}

def test_false_color_composite_with_valid_bands(sentinel2_geotiff_path):
    # Color Infrared: R=NIR(4), G=Red(3), B=Green(2)
    fcc = create_false_color_composite(sentinel2_geotiff_path, preset="Color_Infrared")
    assert fcc["success"] is True
    assert fcc["required_bands_present"] is True
    assert fcc["composite_url"].startswith("/api/v1/processed/")

def test_false_color_composite_with_missing_bands(rgb_geotiff_path):
    # RGB image only has 3 bands -> Color Infrared requires NIR (4th band)
    fcc = create_false_color_composite(rgb_geotiff_path, preset="Color_Infrared")
    assert fcc["success"] is False
    assert fcc["required_bands_present"] is False
    assert "without an available Near-Infrared (NIR) channel" in fcc["message"]

# =====================================================================
# 5. Spectral Indices Tests
# =====================================================================
def test_spectral_indices_on_multiband(sentinel2_geotiff_path):
    # 5-band GeoTIFF has NIR (Band 4) and Red (Band 3)
    ndvi = compute_spectral_index(path=sentinel2_geotiff_path, index_type="NDVI", nir_band_idx=4, red_band_idx=3)
    assert ndvi["required_bands_present"] is True
    assert -1.0 <= ndvi["mean_value"] <= 1.0
    assert ndvi["colormap_image_url"].startswith("/api/v1/processed/")
    assert len(ndvi["histogram"].bins) == 50

    ndwi = compute_spectral_index(path=sentinel2_geotiff_path, index_type="NDWI", nir_band_idx=4, green_band_idx=2)
    assert ndwi["required_bands_present"] is True

    savi = compute_spectral_index(path=sentinel2_geotiff_path, index_type="SAVI", nir_band_idx=4, red_band_idx=3)
    assert savi["required_bands_present"] is True

def test_spectral_indices_on_rgb_only(rgb_geotiff_path):
    # RGB only has 3 bands -> NDVI cannot be computed
    ndvi = compute_spectral_index(path=rgb_geotiff_path, index_type="NDVI")
    assert ndvi["required_bands_present"] is False
    assert "NIR (Near-Infrared) spectral band is required" in ndvi["interpretation"]

# =====================================================================
# 6. Study Area Project Tests
# =====================================================================
def test_study_area_projects(sentinel2_geotiff_path):
    proj = create_study_area_project(
        project_name="Test Study Area Project",
        raster_path=sentinel2_geotiff_path,
        description="Testing study area creation"
    )
    assert proj["project_id"].startswith("proj_")
    assert proj["area_hectares"] > 0
    assert proj["metadata"]["band_count"] == 5

    all_projs = list_study_area_projects()
    assert len(all_projs) >= 1

# =====================================================================
# 7. Remote Sensing API Endpoints Integration Tests
# =====================================================================
def test_api_sample_scenes():
    response = client.get("/api/v1/remote-sensing/sample-scenes")
    assert response.status_code == 200
    data = response.json()
    assert "scenes" in data
    assert len(data["scenes"]) >= 2

def test_api_validate(sentinel2_geotiff_path):
    response = client.post(
        "/api/v1/remote-sensing/validate",
        data={"raster_path": sentinel2_geotiff_path}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["band_count"] == 5

def test_api_metadata(sentinel2_geotiff_path):
    response = client.post(
        "/api/v1/remote-sensing/metadata",
        data={"raster_path": sentinel2_geotiff_path}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["band_count"] == 5
    assert "EPSG:32643" in data["crs"]
    assert len(data["bands"]) == 5

def test_api_bands_inspect(sentinel2_geotiff_path):
    response = client.post(
        "/api/v1/remote-sensing/bands/inspect",
        data={"raster_path": sentinel2_geotiff_path}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_bands"] == 5
    assert len(data["bands"]) == 5

def test_api_bands_visualize(sentinel2_geotiff_path):
    response = client.post(
        "/api/v1/remote-sensing/bands/visualize",
        json={
            "raster_path": sentinel2_geotiff_path,
            "band_index": 4,
            "colormap": "viridis"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["band_index"] == 4
    assert data["colormap"] == "viridis"
    assert "preview_url" in data

def test_api_composite_rgb(sentinel2_geotiff_path):
    response = client.post(
        "/api/v1/remote-sensing/composite/rgb",
        json={
            "raster_path": sentinel2_geotiff_path,
            "r_band_idx": 3,
            "g_band_idx": 2,
            "b_band_idx": 1
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "composite_url" in data

def test_api_composite_false_color(sentinel2_geotiff_path):
    response = client.post(
        "/api/v1/remote-sensing/composite/false-color",
        json={
            "raster_path": sentinel2_geotiff_path,
            "preset": "Color_Infrared"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["required_bands_present"] is True

def test_api_spectral_index(sentinel2_geotiff_path):
    response = client.post(
        f"/api/v1/remote-sensing/spectral-index?index_type=NDVI&raster_path={sentinel2_geotiff_path}&nir_band_idx=4&red_band_idx=3"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["index_type"] == "NDVI"
    assert data["required_bands_present"] is True
    assert "colormap_image_url" in data

def test_api_study_area(sentinel2_geotiff_path):
    response = client.post(
        "/api/v1/remote-sensing/study-area",
        data={
            "project_name": "API Test Project",
            "raster_path": sentinel2_geotiff_path,
            "description": "Integration test study area"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"].startswith("proj_")

    res_list = client.get("/api/v1/remote-sensing/study-area/list")
    assert res_list.status_code == 200
    projects = res_list.json()
    assert len(projects) >= 1
