import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import numpy as np
import cv2
from fastapi.testclient import TestClient
from main import app
from app.services.dip_service import dip_service
from app.services.rs_service import rs_service
from app.services.gis_service import gis_service
from app.services.lulc_service import lulc_service
from app.services.rag_service import rag_service
from app.core.config import settings

client = TestClient(app)

@pytest.fixture
def sample_image_path():
    p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
    assert os.path.exists(p), f"Sample image does not exist at {p}"
    return p

# -------------------------------------------------------------
# 1. Digital Image Processing (DIP) Tests
# -------------------------------------------------------------
def test_dip_histogram_and_stats(sample_image_path):
    img = dip_service.load_image(sample_image_path)
    stats = dip_service.compute_stats(img)
    assert stats.width == 512
    assert stats.height == 512
    assert stats.min_val >= 0
    assert stats.max_val <= 255
    
    hist = dip_service.compute_histogram(img)
    assert len(hist.bins) == 256
    assert len(hist.counts_gray) == 256
    assert sum(hist.counts_gray) == 512 * 512

def test_dip_operations(sample_image_path):
    operations = [
        ("equalize", {}),
        ("clahe", {"clip_limit": 2.5, "tile_grid_size": 8}),
        ("contrast_stretch", {"p_low": 2, "p_high": 98}),
        ("mean_filter", {"kernel_size": 5}),
        ("median_filter", {"kernel_size": 5}),
        ("gaussian_filter", {"kernel_size": 5, "sigma": 1.5}),
        ("sharpen", {"strength": 1.2}),
        ("sobel", {"kernel_size": 3}),
        ("prewitt", {}),
        ("roberts", {}),
        ("canny", {"threshold1": 50, "threshold2": 150}),
        ("otsu", {}),
        ("multi_otsu", {"classes": 3}),
        ("adaptive_thresh", {"block_size": 11, "c_val": 2}),
        ("fft", {}),
        ("kmeans_segmentation", {"k": 4})
    ]

    for op, params in operations:
        res = dip_service.apply_operation(sample_image_path, op, params)
        assert res.success is True
        assert res.output_image_url.startswith("/api/v1/processed/")
        assert res.stats_processed.width == 512
        assert res.mathematical_formula is not None or res.academic_reference is not None

def test_dip_quality_metrics(sample_image_path):
    res = dip_service.evaluate_quality(sample_image_path, sample_image_path)
    assert res.psnr > 40.0 # Identical image has high PSNR
    assert res.ssim == pytest.approx(1.0, rel=1e-2)
    assert res.mse == pytest.approx(0.0, abs=1e-2)

def test_dip_image_registration(sample_image_path):
    # Test registration of scene with itself (identity homography)
    res = dip_service.register_images(sample_image_path, sample_image_path)
    assert res.success is True
    assert res.num_matches >= 4
    assert res.homography_matrix is not None
    assert res.alignment_error == pytest.approx(0.0, abs=1e-2)

# -------------------------------------------------------------
# 2. Remote Sensing Tests
# -------------------------------------------------------------
def test_spectral_indices():
    nir_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_nir.png")
    red_p = os.path.join(settings.SAMPLE_DATA_DIR, "band_red.png")
    
    res_ndvi = rs_service.process_multispectral_scene(nir_p, red_p, index_type="NDVI")
    assert res_ndvi.index_type == "NDVI"
    assert -1.0 <= res_ndvi.mean_value <= 1.0
    assert res_ndvi.min_value >= -1.0
    assert res_ndvi.max_value <= 1.0
    assert len(res_ndvi.histogram.bins) == 50

# -------------------------------------------------------------
# 3. GIS & Vector Analytics Tests
# -------------------------------------------------------------
def test_gis_geodesic_area():
    test_geojson = {
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
    area_res = gis_service.compute_polygon_metrics(test_geojson)
    assert area_res.area_sq_meters > 0
    assert area_res.area_hectares > 0
    assert area_res.area_sq_km > 0
    assert area_res.is_valid is True
    assert len(area_res.centroid) == 2

def test_gis_buffer():
    test_geojson = {
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
    buf_res = gis_service.create_buffer(test_geojson, distance_meters=200.0)
    assert buf_res.buffered_area_ha > buf_res.original_area_ha
    assert buf_res.buffered_geojson["type"] == "Feature"

# -------------------------------------------------------------
# 4. LULC & Temporal Change Tests
# -------------------------------------------------------------
def test_lulc_classification(sample_image_path):
    res = lulc_service.process_dataset_lulc(sample_image_path, "Test Scene", res_m=10.0)
    assert len(res.classes) == 5
    total_pct = sum(c.percentage for c in res.classes)
    assert total_pct == pytest.approx(100.0, rel=1e-1)
    assert res.total_area_hectares > 0

def test_lulc_temporal_comparison():
    t1_p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
    t2_p = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2025_t2.png")
    res = lulc_service.compare_temporal_scenes(t1_p, t2_p, "2020", "2025", res_m=10.0)
    assert len(res.transition_matrix) == 5
    assert len(res.transition_matrix[0]) == 5
    assert len(res.class_changes) == 5

# -------------------------------------------------------------
# 5. RAG Engine Tests
# -------------------------------------------------------------
def test_rag_knowledge_indexing_and_search():
    kb_path = os.path.join(settings.KNOWLEDGE_BASE_DIR, "remote_sensing_fundamentals.md")
    ingest_res = rag_service.ingest_document(kb_path, "Academic")
    assert ingest_res.num_chunks > 0

    citations = rag_service.search("What is NDVI formula and values?", top_k=2)
    assert len(citations) > 0
    assert "NDVI" in citations[0].snippet or "Vegetation" in citations[0].snippet

# -------------------------------------------------------------
# 6. FastAPI API Endpoint Integration Tests
# -------------------------------------------------------------
def test_api_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["services"]["dip_engine"] is True

def test_api_sample_scenes():
    response = client.get("/api/v1/remote-sensing/sample-scenes")
    assert response.status_code == 200
    data = response.json()
    assert len(data["scenes"]) >= 2

def test_api_gis_area_metrics():
    payload = {
        "geojson": {
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
    response = client.post("/api/v1/gis/area-metrics", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["area_hectares"] > 0

def test_api_lulc_classify():
    response = client.post("/api/v1/lulc/classify?scene_id=scene_2020&resolution_m=10.0")
    assert response.status_code == 200
    data = response.json()
    assert len(data["classes"]) == 5
