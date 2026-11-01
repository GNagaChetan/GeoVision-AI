import os
import json
import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, status
from app.core.config import settings
from app.core.security import validate_geojson_structure, sanitize_filename
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
from app.models.schemas import (
    SpatialAreaRequest,
    SpatialAreaResponse,
    SpatialBufferRequest,
    SpatialBufferResponse,
    GeoJSONValidationRequest,
    GeoJSONValidationResponse,
    DistanceCalculationRequest,
    DistanceCalculationResponse,
    PointInPolygonRequest,
    PointInPolygonResponse,
    BBoxQueryRequest,
    BBoxQueryResponse,
    SpatialFilterRequest,
    SpatialFilterResponse,
    PolygonStatisticsRequest,
    PolygonStatisticsResponse,
    VectorLayerCreateRequest,
    VectorLayerUpdateRequest,
    VectorLayerResponse,
    RasterLayerCreateRequest,
    RasterLayerUpdateRequest,
    RasterLayerResponse,
    LayerReorderRequest,
    StudyAreaCreateRequest,
    StudyAreaResponse,
    CRSValidationRequest,
    CRSValidationResponse,
    CRSTransformRequest,
    CRSTransformResponse,
    RasterGISMetadataRequest,
    RasterGISMetadataResponse
)

router = APIRouter()

# -------------------------------------------------------------------
# Study Area & Geodesic Basics
# -------------------------------------------------------------------
@router.get("/sample-study-area")
async def get_sample_study_area():
    """Retrieve verified GeoJSON polygon for the default study area boundary."""
    geojson_path = os.path.join(settings.SAMPLE_DATA_DIR, "study_area_boundary.geojson")
    if not os.path.exists(geojson_path):
        raise HTTPException(status_code=404, detail="Sample study area GeoJSON not found.")
    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@router.post("/area-metrics", response_model=SpatialAreaResponse)
async def compute_area(request: SpatialAreaRequest):
    """Compute true geodesic area on WGS84 ellipsoid (m2, ha, km2) with perimeter and centroid."""
    if not validate_geojson_structure(request.geojson):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid GeoJSON geometry structure.")

    try:
        return gis_service.compute_polygon_metrics(request.geojson)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Area computation error: {str(e)}")

@router.post("/buffer", response_model=SpatialBufferResponse)
async def create_buffer_zone(request: SpatialBufferRequest):
    """Generate geodesic spatial buffer polygon via local UTM conformal projection."""
    if not validate_geojson_structure(request.geojson):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid GeoJSON geometry structure.")

    if request.distance_meters <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Buffer distance must be positive.")

    try:
        return gis_service.create_buffer(request.geojson, request.distance_meters)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Buffer generation error: {str(e)}")

# -------------------------------------------------------------------
# GeoJSON Validation & Upload
# -------------------------------------------------------------------
@router.post("/validate-geojson", response_model=GeoJSONValidationResponse)
async def validate_geojson_endpoint(request: GeoJSONValidationRequest):
    """Validate geometry structure, ring closures, coordinate bounds, and self-intersections."""
    is_valid, issues, repaired_geojson, details = validate_geojson_geometry(request.geojson)
    return GeoJSONValidationResponse(
        is_valid=is_valid,
        issues=issues,
        feature_count=details.get("feature_count", 0),
        geometry_types=details.get("geometry_types", []),
        total_vertices=details.get("total_vertices", 0),
        repaired_geojson=repaired_geojson
    )

@router.post("/upload-geojson")
async def upload_geojson(
    file: UploadFile = File(...),
    layer_name: Optional[str] = Form(None),
    study_area_id: Optional[str] = Form(None)
):
    """Upload vector GeoJSON file and auto-register as a vector layer."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name.")
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".geojson", ".json"):
        raise HTTPException(status_code=400, detail=f"Invalid file extension '{ext}'. Only .geojson or .json accepted.")

    try:
        contents = await file.read()
        geojson_data = json.loads(contents.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file as valid JSON: {str(e)}")

    name = layer_name or os.path.splitext(sanitize_filename(file.filename))[0]
    layer_obj = layer_manager.create_vector_layer(
        name=name,
        geojson_data=geojson_data,
        study_area_id=study_area_id
    )

    return {
        "success": True,
        "message": f"Vector layer '{name}' registered successfully.",
        "layer": layer_obj
    }

# -------------------------------------------------------------------
# Distance & Path Calculations
# -------------------------------------------------------------------
@router.post("/distance", response_model=DistanceCalculationResponse)
async def calculate_distance_endpoint(request: DistanceCalculationRequest):
    """Compute true geodesic distance and azimuth along a list of [lon, lat] coordinates."""
    try:
        res = geodesic_engine.calculate_distance(request.coordinates)
        return DistanceCalculationResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Distance calculation error: {str(e)}")

# -------------------------------------------------------------------
# Spatial Queries & Filters
# -------------------------------------------------------------------
@router.post("/query/point-in-polygon", response_model=PointInPolygonResponse)
async def point_in_polygon_query_endpoint(request: PointInPolygonRequest):
    """Query which features in a layer or GeoJSON contain the given point coordinate [lon, lat]."""
    if len(request.point) < 2:
        raise HTTPException(status_code=400, detail="Point must contain [lon, lat] coordinates.")

    target_data = None
    if request.geojson:
        target_data = request.geojson
    elif request.layer_id:
        layer = layer_manager.get_vector_layer(request.layer_id)
        if not layer:
            raise HTTPException(status_code=404, detail=f"Vector layer '{request.layer_id}' not found.")
        target_data = layer["geojson_data"]
    else:
        # Query across all active vector layers
        all_layers = layer_manager.list_vector_layers()
        features = []
        for l in all_layers:
            if l.get("visible", True) and "geojson_data" in l:
                g = l["geojson_data"]
                if g.get("type") == "FeatureCollection":
                    features.extend(g.get("features", []))
                elif g.get("type") == "Feature":
                    features.append(g)
        target_data = {"type": "FeatureCollection", "features": features}

    matches = spatial_query_engine.point_in_polygon_query(
        point_lon=request.point[0],
        point_lat=request.point[1],
        features_or_geojson=target_data
    )

    return PointInPolygonResponse(matches=matches, point=request.point)

@router.post("/query/bbox", response_model=BBoxQueryResponse)
async def bbox_query_endpoint(request: BBoxQueryRequest):
    """Spatial query filtering features that intersect or are contained in [minx, miny, maxx, maxy]."""
    target_data = None
    if request.geojson:
        target_data = request.geojson
    elif request.layer_id:
        layer = layer_manager.get_vector_layer(request.layer_id)
        if not layer:
            raise HTTPException(status_code=404, detail=f"Vector layer '{request.layer_id}' not found.")
        target_data = layer["geojson_data"]
    else:
        all_layers = layer_manager.list_vector_layers()
        features = []
        for l in all_layers:
            if l.get("visible", True) and "geojson_data" in l:
                g = l["geojson_data"]
                if g.get("type") == "FeatureCollection":
                    features.extend(g.get("features", []))
                elif g.get("type") == "Feature":
                    features.append(g)
        target_data = {"type": "FeatureCollection", "features": features}

    try:
        res = spatial_query_engine.query_bounding_box(
            bbox=request.bbox,
            features_or_geojson=target_data,
            predicate=request.predicate
        )
        return BBoxQueryResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"BBox query error: {str(e)}")

@router.post("/query/spatial-filter", response_model=SpatialFilterResponse)
async def spatial_filter_endpoint(request: SpatialFilterRequest):
    """Filter target GeoJSON features based on spatial relationship to reference geometry."""
    try:
        res = spatial_query_engine.filter_by_spatial_relationship(
            target_geojson=request.target_geojson,
            reference_geojson=request.reference_geojson,
            predicate=request.predicate
        )
        return SpatialFilterResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Spatial filter error: {str(e)}")

@router.post("/polygon-statistics", response_model=PolygonStatisticsResponse)
async def polygon_statistics_endpoint(request: PolygonStatisticsRequest):
    """Compute polygon dataset descriptive statistics (mean/median/std area, compactness, vertices)."""
    target_data = None
    if request.geojson:
        target_data = request.geojson
    elif request.layer_id:
        layer = layer_manager.get_vector_layer(request.layer_id)
        if not layer:
            raise HTTPException(status_code=404, detail=f"Vector layer '{request.layer_id}' not found.")
        target_data = layer["geojson_data"]
    else:
        # Default sample study area
        geojson_path = os.path.join(settings.SAMPLE_DATA_DIR, "study_area_boundary.geojson")
        with open(geojson_path, "r", encoding="utf-8") as f:
            target_data = json.load(f)

    try:
        stats_dict = spatial_query_engine.calculate_polygon_dataset_statistics(target_data)
        return PolygonStatisticsResponse(**stats_dict)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Polygon statistics error: {str(e)}")

# -------------------------------------------------------------------
# Vector Layer CRUD & Management
# -------------------------------------------------------------------
@router.get("/vector-layers", response_model=List[VectorLayerResponse])
async def list_vector_layers(study_area_id: Optional[str] = Query(None)):
    """List all vector GIS layers."""
    return layer_manager.list_vector_layers(study_area_id)

@router.post("/vector-layers", response_model=VectorLayerResponse)
async def create_vector_layer(request: VectorLayerCreateRequest):
    """Create a new vector GIS layer."""
    return layer_manager.create_vector_layer(
        name=request.name,
        geojson_data=request.geojson,
        study_area_id=request.study_area_id,
        style_config=request.style_config,
        layer_type=request.layer_type
    )

@router.get("/vector-layers/{layer_id}", response_model=VectorLayerResponse)
async def get_vector_layer(layer_id: str):
    """Retrieve a vector layer by ID."""
    layer = layer_manager.get_vector_layer(layer_id)
    if not layer:
        raise HTTPException(status_code=404, detail=f"Vector layer '{layer_id}' not found.")
    return layer

@router.patch("/vector-layers/{layer_id}", response_model=VectorLayerResponse)
async def update_vector_layer(layer_id: str, request: VectorLayerUpdateRequest):
    """Update visibility, styling, z-index, or name of a vector layer."""
    updates = request.model_dump(exclude_unset=True)
    layer = layer_manager.update_vector_layer(layer_id, updates)
    if not layer:
        raise HTTPException(status_code=404, detail=f"Vector layer '{layer_id}' not found.")
    return layer

@router.delete("/vector-layers/{layer_id}")
async def delete_vector_layer(layer_id: str):
    """Delete a vector layer."""
    deleted = layer_manager.delete_vector_layer(layer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Vector layer '{layer_id}' not found.")
    return {"success": True, "message": f"Vector layer '{layer_id}' deleted."}

@router.get("/vector-layers/{layer_id}/export")
async def export_vector_layer_geojson(layer_id: str):
    """Export vector layer as GeoJSON FeatureCollection."""
    try:
        return layer_manager.export_layer_geojson(layer_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Vector layer '{layer_id}' not found.")

# -------------------------------------------------------------------
# Raster Layer CRUD & Management
# -------------------------------------------------------------------
@router.get("/raster-layers", response_model=List[RasterLayerResponse])
async def list_raster_layers(study_area_id: Optional[str] = Query(None)):
    """List all registered raster layers."""
    return layer_manager.list_raster_layers(study_area_id)

@router.post("/raster-layers", response_model=RasterLayerResponse)
async def create_raster_layer(request: RasterLayerCreateRequest):
    """Register a new raster layer."""
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail=f"Raster file '{request.file_path}' not found.")
    return layer_manager.create_raster_layer(
        name=request.name,
        file_path=request.file_path,
        study_area_id=request.study_area_id,
        colormap=request.colormap,
        opacity=request.opacity
    )

@router.patch("/raster-layers/{layer_id}", response_model=RasterLayerResponse)
async def update_raster_layer(layer_id: str, request: RasterLayerUpdateRequest):
    """Update raster layer opacity, visibility, colormap, or z-index."""
    updates = request.model_dump(exclude_unset=True)
    layer = layer_manager.update_raster_layer(layer_id, updates)
    if not layer:
        raise HTTPException(status_code=404, detail=f"Raster layer '{layer_id}' not found.")
    return layer

@router.delete("/raster-layers/{layer_id}")
async def delete_raster_layer(layer_id: str):
    """Delete a raster layer."""
    deleted = layer_manager.delete_raster_layer(layer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Raster layer '{layer_id}' not found.")
    return {"success": True, "message": f"Raster layer '{layer_id}' deleted."}

@router.post("/layers/reorder")
async def reorder_layers_endpoint(request: LayerReorderRequest):
    """Update layer z-index order for map rendering."""
    return layer_manager.reorder_layers(request.ordered_layer_ids)

# -------------------------------------------------------------------
# Study Area Management
# -------------------------------------------------------------------
@router.get("/study-areas", response_model=List[StudyAreaResponse])
async def list_study_areas():
    """List all saved study areas."""
    return study_area_manager.list_study_areas()

@router.post("/study-areas", response_model=StudyAreaResponse)
async def create_study_area(request: StudyAreaCreateRequest):
    """Create a new study area project with geodesic metrics."""
    return study_area_manager.create_study_area(
        name=request.name,
        boundary_geojson=request.boundary_geojson,
        description=request.description,
        dataset_id=request.dataset_id
    )

@router.get("/study-areas/{study_area_id}", response_model=StudyAreaResponse)
async def get_study_area(study_area_id: str):
    """Retrieve study area by ID."""
    sa = study_area_manager.get_study_area(study_area_id)
    if not sa:
        raise HTTPException(status_code=404, detail=f"Study area '{study_area_id}' not found.")
    return sa

@router.delete("/study-areas/{study_area_id}")
async def delete_study_area(study_area_id: str):
    """Delete a study area."""
    deleted = study_area_manager.delete_study_area(study_area_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Study area '{study_area_id}' not found.")
    return {"success": True, "message": f"Study area '{study_area_id}' deleted."}

# -------------------------------------------------------------------
# CRS Validation & Reprojection
# -------------------------------------------------------------------
@router.post("/crs/validate", response_model=CRSValidationResponse)
async def validate_crs_endpoint(request: CRSValidationRequest):
    """Validate CRS (EPSG code or Proj4 string) and retrieve spatial parameters."""
    res = crs_engine.validate_and_describe_crs(request.crs)
    return CRSValidationResponse(**res)

@router.post("/crs/transform", response_model=CRSTransformResponse)
async def transform_crs_endpoint(request: CRSTransformRequest):
    """Reproject GeoJSON geometry between coordinate reference systems."""
    try:
        transformed = crs_engine.transform_geojson_crs(
            geojson_data=request.geojson,
            src_crs=request.src_crs,
            dst_crs=request.dst_crs
        )
        return CRSTransformResponse(
            transformed_geojson=transformed,
            src_crs=request.src_crs,
            dst_crs=request.dst_crs
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"CRS transformation error: {str(e)}")

# -------------------------------------------------------------------
# Raster GIS Metadata
# -------------------------------------------------------------------
@router.post("/raster-metadata", response_model=RasterGISMetadataResponse)
async def raster_gis_metadata_endpoint(request: RasterGISMetadataRequest):
    """Extract spatial resolution, CRS, affine transform, and bounds using Rasterio."""
    try:
        res = raster_gis_engine.extract_raster_metadata(request.file_path)
        return RasterGISMetadataResponse(**res)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Raster file '{request.file_path}' not found.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Raster metadata error: {str(e)}")
