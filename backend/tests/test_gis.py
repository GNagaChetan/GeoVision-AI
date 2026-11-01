import os
import sys
import json
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.services.gis import (
    gis_service,
    validate_geojson_geometry,
    geodesic_engine,
    spatial_query_engine,
    raster_gis_engine,
    crs_engine,
    layer_manager,
    study_area_manager
)

client = TestClient(app)

SAMPLE_POLYGON_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": "poly_1",
            "properties": {"name": "Test Parcel Alpha", "land_use": "Commercial"},
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
        },
        {
            "type": "Feature",
            "id": "poly_2",
            "properties": {"name": "Test Parcel Beta", "land_use": "Park"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [78.4500, 17.4200],
                        [78.4700, 17.4200],
                        [78.4700, 17.4400],
                        [78.4500, 17.4400],
                        [78.4500, 17.4200]
                    ]
                ]
            }
        }
    ]
}

def test_geodesic_polygon_metrics():
    """Verify true ellipsoidal area and perimeter calculation on WGS84 ellipsoid."""
    metrics = geodesic_engine.calculate_polygon_metrics(SAMPLE_POLYGON_GEOJSON)
    assert metrics["area_hectares"] > 1000.0
    assert metrics["area_sq_km"] > 10.0
    assert metrics["perimeter_meters"] > 10000.0
    assert len(metrics["centroid"]) == 2
    assert len(metrics["bounding_box"]) == 4
    assert metrics["is_valid"] is True
    assert 0.0 <= metrics["compactness_score"] <= 1.0

def test_geodesic_distance_calculation():
    """Verify geodesic distance calculation along a multi-point path."""
    coords = [
        [78.4350, 17.4120],
        [78.4862, 17.4120],
        [78.4862, 17.4632]
    ]
    res = geodesic_engine.calculate_distance(coords)
    assert res["total_distance_meters"] > 5000.0
    assert res["total_distance_km"] > 5.0
    assert len(res["segments"]) == 2
    assert res["point_count"] == 3

def test_geodesic_utm_buffer():
    """Verify projected local UTM geodesic buffer zone generation."""
    res = geodesic_engine.create_geodesic_buffer(SAMPLE_POLYGON_GEOJSON, distance_meters=200.0)
    assert res["buffered_area_ha"] > res["original_area_ha"]
    assert res["expansion_ha"] > 0
    assert "EPSG:32643" in res["utm_projection"] or "EPSG:" in res["utm_projection"]
    assert res["buffered_geojson"]["type"] == "Feature"

def test_geojson_validation_valid():
    """Verify validation of well-formed GeoJSON."""
    is_valid, issues, repaired, details = validate_geojson_geometry(SAMPLE_POLYGON_GEOJSON)
    assert is_valid is True
    assert len(issues) == 0
    assert details["feature_count"] == 2

def test_geojson_validation_unclosed_ring_and_repair():
    """Verify detection and repair of unclosed polygon rings."""
    unclosed_geojson = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [78.4350, 17.4120],
                    [78.4862, 17.4120],
                    [78.4862, 17.4632],
                    [78.4350, 17.4632] # missing closing point
                ]
            ]
        }
    }
    is_valid, issues, repaired, details = validate_geojson_geometry(unclosed_geojson)
    assert is_valid is False
    assert any("not closed" in issue for issue in issues)

def test_point_in_polygon_query():
    """Verify Point-in-Polygon spatial query."""
    # Point inside Parcel Beta
    inside_pt = [78.4600, 17.4300]
    matches = spatial_query_engine.point_in_polygon_query(inside_pt[0], inside_pt[1], SAMPLE_POLYGON_GEOJSON)
    assert len(matches) >= 1
    matched_ids = [m["feature_id"] for m in matches]
    assert "poly_1" in matched_ids or "poly_2" in matched_ids

    # Point outside everything
    outside_pt = [70.0, 10.0]
    no_matches = spatial_query_engine.point_in_polygon_query(outside_pt[0], outside_pt[1], SAMPLE_POLYGON_GEOJSON)
    assert len(no_matches) == 0

def test_bbox_query():
    """Verify Bounding Box spatial query."""
    bbox = [78.4400, 17.4150, 78.4650, 17.4350]
    res = spatial_query_engine.query_bounding_box(bbox, SAMPLE_POLYGON_GEOJSON, predicate="intersects")
    assert res["matched_count"] >= 1
    assert "features" in res["result_geojson"]

def test_spatial_relationship_filter():
    """Verify spatial predicate filtering."""
    ref_geojson = {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [78.4000, 17.4000],
                    [78.5000, 17.4000],
                    [78.5000, 17.5000],
                    [78.4000, 17.5000],
                    [78.4000, 17.4000]
                ]
            ]
        }
    }
    res = spatial_query_engine.filter_by_spatial_relationship(SAMPLE_POLYGON_GEOJSON, ref_geojson, predicate="within")
    assert res["matched_count"] == 2

def test_polygon_dataset_statistics():
    """Verify descriptive statistics computation across polygon datasets."""
    stats = spatial_query_engine.calculate_polygon_dataset_statistics(SAMPLE_POLYGON_GEOJSON)
    assert stats["total_features"] == 2
    assert stats["total_area_hectares"] > 0
    assert stats["mean_area_ha"] > 0
    assert stats["total_vertices"] >= 10
    assert len(stats["dataset_bounding_box"]) == 4

def test_crs_validation_and_transform():
    """Verify CRS validator and coordinate transformer."""
    # CRS validation
    crs_info = crs_engine.validate_and_describe_crs("EPSG:4326")
    assert crs_info["is_valid"] is True
    assert crs_info["is_geographic"] is True

    crs_proj = crs_engine.validate_and_describe_crs("EPSG:32643")
    assert crs_proj["is_valid"] is True
    assert crs_proj["is_projected"] is True

    # CRS transform
    transformed = crs_engine.transform_geojson_crs(SAMPLE_POLYGON_GEOJSON, "EPSG:4326", "EPSG:3857")
    assert transformed["type"] == "FeatureCollection"
    coords = transformed["features"][0]["geometry"]["coordinates"][0][0]
    assert abs(coords[0]) > 100000.0 # Projected into Web Mercator meters

def test_raster_gis_metadata():
    """Verify raster GIS metadata extraction."""
    sample_geotiff = os.path.join("data", "sample_datasets", "sentinel2_multispectral_sample.tif")
    if os.path.exists(sample_geotiff):
        meta = raster_gis_engine.extract_raster_metadata(sample_geotiff)
        assert meta["width"] == 512
        assert meta["height"] == 512
        assert meta["band_count"] == 5
        assert len(meta["bounds_wgs84"]) == 4
        assert meta["geographic_extent"] is not None

def test_vector_layer_crud_and_reorder():
    """Verify vector layer creation, update, reordering, and export."""
    layer = layer_manager.create_vector_layer(
        name="Test Urban Zones",
        geojson_data=SAMPLE_POLYGON_GEOJSON,
        style_config={"fill_color": "#f43f5e", "stroke_width": 3}
    )
    layer_id = layer["id"]
    assert layer["name"] == "Test Urban Zones"
    assert layer["feature_count"] == 2

    # Get layer
    fetched = layer_manager.get_vector_layer(layer_id)
    assert fetched is not None
    assert fetched["id"] == layer_id

    # Update layer
    updated = layer_manager.update_vector_layer(layer_id, {"visible": False, "name": "Updated Urban Zones"})
    assert updated["visible"] is False
    assert updated["name"] == "Updated Urban Zones"

    # Export GeoJSON
    exported = layer_manager.export_layer_geojson(layer_id)
    assert exported["type"] == "FeatureCollection"

    # Delete layer
    deleted = layer_manager.delete_vector_layer(layer_id)
    assert deleted is True

def test_study_area_manager():
    """Verify study area project creation and management."""
    sa = study_area_manager.create_study_area(
        name="Greater Hyderabad AOI",
        boundary_geojson=SAMPLE_POLYGON_GEOJSON,
        description="Comprehensive metropolitan area boundary"
    )
    sa_id = sa["id"]
    assert sa["name"] == "Greater Hyderabad AOI"
    assert sa["area_hectares"] > 0

    all_sa = study_area_manager.list_study_areas()
    assert any(s["id"] == sa_id for s in all_sa)

    # Cleanup
    study_area_manager.delete_study_area(sa_id)

def test_api_gis_endpoints():
    """Verify GIS REST API endpoints."""
    # 1. Validate GeoJSON
    val_res = client.post("/api/v1/gis/validate-geojson", json={"geojson": SAMPLE_POLYGON_GEOJSON})
    assert val_res.status_code == 200
    assert val_res.json()["is_valid"] is True

    # 2. Distance calculation
    dist_res = client.post("/api/v1/gis/distance", json={
        "coordinates": [[78.435, 17.412], [78.486, 17.412]]
    })
    assert dist_res.status_code == 200
    assert dist_res.json()["total_distance_meters"] > 0

    # 3. Point in polygon query
    pip_res = client.post("/api/v1/gis/query/point-in-polygon", json={
        "point": [78.460, 17.430],
        "geojson": SAMPLE_POLYGON_GEOJSON
    })
    assert pip_res.status_code == 200
    assert len(pip_res.json()["matches"]) >= 1

    # 4. BBox query
    bbox_res = client.post("/api/v1/gis/query/bbox", json={
        "bbox": [78.44, 17.415, 78.465, 17.435],
        "geojson": SAMPLE_POLYGON_GEOJSON,
        "predicate": "intersects"
    })
    assert bbox_res.status_code == 200
    assert bbox_res.json()["matched_count"] >= 1

    # 5. Polygon statistics
    stat_res = client.post("/api/v1/gis/polygon-statistics", json={"geojson": SAMPLE_POLYGON_GEOJSON})
    assert stat_res.status_code == 200
    assert stat_res.json()["total_features"] == 2

    # 6. CRS validation
    crs_res = client.post("/api/v1/gis/crs/validate", json={"crs": "EPSG:4326"})
    assert crs_res.status_code == 200
    assert crs_res.json()["is_valid"] is True

    # 7. Vector layers listing
    layers_res = client.get("/api/v1/gis/vector-layers")
    assert layers_res.status_code == 200
    assert isinstance(layers_res.json(), list)

    # 8. Study areas listing
    sa_res = client.get("/api/v1/gis/study-areas")
    assert sa_res.status_code == 200
    assert isinstance(sa_res.json(), list)
