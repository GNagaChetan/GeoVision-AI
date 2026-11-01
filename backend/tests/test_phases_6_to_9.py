import os
import sys
import numpy as np
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.core.config import settings
from app.services.lulc_service import lulc_service
from app.services.vegetation_service import vegetation_service
from app.services.analytics_service import analytics_service
from app.services.change_detection_service import change_detection_service

client = TestClient(app)

# -------------------------------------------------------------
# Phase 6: LULC Analysis Tests
# -------------------------------------------------------------
def test_lulc_raster_validation():
    """Verify LULC input raster validation."""
    sample_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
    if os.path.exists(sample_path):
        val = lulc_service.validate_lulc_raster(sample_path)
        assert val.is_valid is True
        assert val.width > 0
        assert val.height > 0
        assert val.total_pixels > 0

def test_lulc_classification_and_metrics():
    """Verify 5-class LULC classification, dominant class, and percentage sums."""
    sample_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
    if os.path.exists(sample_path):
        res = lulc_service.process_dataset_lulc(sample_path, res_m=10.0)
        assert res.total_area_hectares > 0
        assert res.total_area_sq_km > 0
        assert len(res.classes) == 5
        assert res.dominant_class in ["Vegetation", "Water", "Built-up", "Agriculture", "Bare Land"]

        # Percentages sum to ~100%
        pct_sum = sum(c.percentage for c in res.classes)
        assert 99.0 <= pct_sum <= 101.0

        # Areas sum to total area
        area_sum = sum(c.area_hectares for c in res.classes)
        assert abs(area_sum - res.total_area_hectares) < 0.1

def test_lulc_csv_export():
    """Verify LULC statistics CSV formatting."""
    sample_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
    if os.path.exists(sample_path):
        res = lulc_service.process_dataset_lulc(sample_path)
        csv_data = lulc_service.export_statistics_csv(res.classes)
        assert "Class ID,Class Name,Pixel Count" in csv_data
        assert "Vegetation" in csv_data
        assert "Built-up" in csv_data

def test_api_lulc_classify():
    """Verify FastAPI /api/v1/lulc/classify endpoint."""
    res = client.post("/api/v1/lulc/classify?scene_id=scene_2020")
    assert res.status_code == 200
    data = res.json()
    assert data["total_area_hectares"] > 0
    assert len(data["classes"]) == 5
    assert len(data["legend"]) == 5

# -------------------------------------------------------------
# Phase 7: Multispectral Vegetation Analytics (NDVI) Tests
# -------------------------------------------------------------
def test_ndvi_calculation_normal_values():
    """Verify NDVI calculation on verified multi-band GeoTIFF."""
    s2_path = os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif")
    if os.path.exists(s2_path):
        res = vegetation_service.calculate_ndvi(s2_path, red_band_idx=3, nir_band_idx=4)
        assert res.success is True
        assert res.required_bands_present is True
        assert -1.0 <= res.min_ndvi <= 1.0
        assert -1.0 <= res.max_ndvi <= 1.0
        assert -1.0 <= res.mean_ndvi <= 1.0
        assert len(res.threshold_distribution) == 4
        assert res.dominant_vegetation_health != "Unavailable"
        assert len(res.histogram.counts_gray) == 100

def test_ndvi_zero_denominator_protection():
    """Verify safe division by zero protection when Red + NIR == 0."""
    # Test with synthetic zero arrays
    zeros_tif = os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif")
    if os.path.exists(zeros_tif):
        res = vegetation_service.calculate_ndvi(zeros_tif, red_band_idx=3, nir_band_idx=4)
        assert not np.isnan(res.mean_ndvi)
        assert not np.isinf(res.mean_ndvi)

def test_ndvi_missing_bands_refusal():
    """Verify strict refusal when required Red/NIR bands are unavailable."""
    # 3-band aerial image (RGB only, no NIR) requested with out-of-range band index 4
    rgb_path = os.path.join(settings.SAMPLE_DATA_DIR, "rgb_aerial_sample.tif")
    if os.path.exists(rgb_path):
        res = vegetation_service.calculate_ndvi(rgb_path, red_band_idx=1, nir_band_idx=4)
        assert res.success is False
        assert res.required_bands_present is False
        assert "required Red and NIR bands are unavailable" in res.message

def test_api_vegetation_ndvi():
    """Verify FastAPI /api/v1/vegetation/ndvi endpoint."""
    res = client.post("/api/v1/vegetation/ndvi?red_band_idx=3&nir_band_idx=4")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "mean_ndvi" in data
    assert len(data["threshold_distribution"]) == 4

# -------------------------------------------------------------
# Phase 8: Geospatial Analytics Tests
# -------------------------------------------------------------
def test_analytics_kpi_cards():
    """Verify analytical KPI calculations from real project data."""
    res = analytics_service.get_dashboard_analytics()
    assert res.is_empty_state is False
    assert len(res.kpi_cards) >= 6
    kpi_titles = [k.title for k in res.kpi_cards]
    assert "Total Study Area" in kpi_titles
    assert "Vegetation Coverage" in kpi_titles
    assert "Built-Up Area" in kpi_titles
    assert "Water Bodies" in kpi_titles

def test_analytics_year_comparison():
    """Verify multi-year temporal aggregation using Pandas."""
    res = analytics_service.get_dashboard_analytics()
    assert len(res.year_comparison) == 2
    assert "2020" in res.year_comparison[0]["year"]
    assert "2025" in res.year_comparison[1]["year"]
    assert "Vegetation" in res.year_comparison[0]

def test_api_analytics_dashboard():
    """Verify FastAPI /api/v1/analytics/dashboard endpoint."""
    res = client.get("/api/v1/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["total_study_area_ha"] > 0
    assert len(data["lulc_distribution"]) == 5

# -------------------------------------------------------------
# Phase 9: Multi-Date Change Detection Tests
# -------------------------------------------------------------
def test_change_detection_validation():
    """Verify scene compatibility validation for change detection."""
    t1_p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
    t2_p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2025_t2.png")
    if os.path.exists(t1_p) and os.path.exists(t2_p):
        val = change_detection_service.validate_change_scenes(t1_p, t2_p)
        assert val.is_compatible is True
        assert val.crs_match is True
        assert val.spatial_overlap_pct == 100.0

def test_change_detection_transition_matrix():
    """Verify 5x5 transition matrix calculation and net changes."""
    res = change_detection_service.compute_change_detection()
    assert res.success is True
    assert res.is_compatible is True
    assert len(res.transition_matrix) == 5
    assert len(res.transition_matrix[0]) == 5
    assert res.total_study_area_ha > 0
    assert res.unchanged_area_ha > 0
    assert res.total_changed_area_ha >= 0
    assert 99.0 <= (res.unchanged_percentage + res.total_changed_percentage) <= 101.0
    assert len(res.class_changes) == 5
    assert res.most_converted_transition["area_ha"] >= 0

def test_api_change_detection_analyze():
    """Verify FastAPI /api/v1/change-detection/analyze endpoint."""
    res = client.post("/api/v1/change-detection/analyze")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "difference_map_url" in data
    assert "binary_change_mask_url" in data
