import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, Date, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

try:
    from geoalchemy2 import Geometry
    HAS_GEOALCHEMY = True
except ImportError:
    HAS_GEOALCHEMY = False

class DatasetModel(Base):
    """Satellite scenes and multi-spectral raster bundles."""
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    sensor = Column(String(100), nullable=False)
    spatial_resolution_m = Column(Float, nullable=False)
    acquisition_date = Column(Date, nullable=False)
    crs = Column(String(50), default="EPSG:4326")
    file_path = Column(Text, nullable=False)
    is_sample_data = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    study_areas = relationship("StudyAreaModel", back_populates="dataset", cascade="all, delete-orphan")
    lulc_runs = relationship("LULCClassificationModel", back_populates="dataset", cascade="all, delete-orphan")


class StudyAreaModel(Base):
    """Geodesic study area vector boundary polygons."""
    __tablename__ = "study_areas"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    dataset_id = Column(String(64), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True)
    
    if HAS_GEOALCHEMY:
        boundary_geom = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=True)
    else:
        boundary_geom = Column(Text, nullable=True)

    boundary_geojson = Column(JSON, nullable=False)
    area_hectares = Column(Float, nullable=False)
    area_sq_km = Column(Float, nullable=False)
    perimeter_meters = Column(Float, nullable=False)
    centroid_lat = Column(Float, nullable=True)
    centroid_lon = Column(Float, nullable=True)
    bbox = Column(JSON, nullable=True) # [minx, miny, maxx, maxy]
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    dataset = relationship("DatasetModel", back_populates="study_areas")
    vector_layers = relationship("VectorLayerModel", back_populates="study_area", cascade="all, delete-orphan")
    raster_layers = relationship("RasterLayerModel", back_populates="study_area", cascade="all, delete-orphan")


class VectorLayerModel(Base):
    """Vector GIS layers (Point, LineString, Polygon, MultiPolygon, FeatureCollection)."""
    __tablename__ = "vector_layers"

    id = Column(String(64), primary_key=True)
    study_area_id = Column(String(64), ForeignKey("study_areas.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(255), nullable=False)
    layer_type = Column(String(50), nullable=False) # 'polygon', 'point', 'linestring', 'multipolygon', 'feature_collection'
    feature_count = Column(Integer, default=0, nullable=False)
    crs = Column(String(50), default="EPSG:4326")
    
    # Styling and visibility configuration
    style_config = Column(JSON, default=dict) # {fill_color, stroke_color, stroke_width, opacity, fill_opacity}
    visible = Column(Boolean, default=True)
    z_index = Column(Integer, default=0)
    
    # Geometric data
    geojson_data = Column(JSON, nullable=False)
    if HAS_GEOALCHEMY:
        geom_collection = Column(Geometry(geometry_type="GEOMETRYCOLLECTION", srid=4326), nullable=True)
    else:
        geom_collection = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    study_area = relationship("StudyAreaModel", back_populates="vector_layers")
    features = relationship("SpatialFeatureModel", back_populates="layer", cascade="all, delete-orphan")


class SpatialFeatureModel(Base):
    """Individual features within a vector layer with PostGIS spatial indexing."""
    __tablename__ = "spatial_features"

    id = Column(String(64), primary_key=True)
    layer_id = Column(String(64), ForeignKey("vector_layers.id", ondelete="CASCADE"), nullable=False)
    feature_index = Column(Integer, default=0)
    properties = Column(JSON, default=dict)
    
    if HAS_GEOALCHEMY:
        geom = Column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True)
    else:
        geom = Column(Text, nullable=True)

    area_ha = Column(Float, nullable=True)
    perimeter_m = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    layer = relationship("VectorLayerModel", back_populates="features")


class RasterLayerModel(Base):
    """Raster GIS layers (GeoTIFF, Single Band, Composite, Spectral Index)."""
    __tablename__ = "raster_layers"

    id = Column(String(64), primary_key=True)
    study_area_id = Column(String(64), ForeignKey("study_areas.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    crs = Column(String(50), default="EPSG:4326")
    spatial_resolution_m = Column(Float, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    band_count = Column(Integer, default=1)
    bounds_wgs84 = Column(JSON, nullable=True) # [min_lon, min_lat, max_lon, max_lat]
    colormap = Column(String(50), default="grayscale")
    opacity = Column(Float, default=1.0)
    visible = Column(Boolean, default=True)
    z_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    study_area = relationship("StudyAreaModel", back_populates="raster_layers")


class LULCClassificationModel(Base):
    """Land Use Land Cover classification run results."""
    __tablename__ = "lulc_classifications"

    id = Column(String(64), primary_key=True)
    dataset_id = Column(String(64), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True)
    total_area_ha = Column(Float, nullable=False)
    vegetation_ha = Column(Float, nullable=False)
    vegetation_pct = Column(Float, nullable=False)
    water_ha = Column(Float, nullable=False)
    water_pct = Column(Float, nullable=False)
    builtup_ha = Column(Float, nullable=False)
    builtup_pct = Column(Float, nullable=False)
    agriculture_ha = Column(Float, nullable=False)
    agriculture_pct = Column(Float, nullable=False)
    bareland_ha = Column(Float, nullable=False)
    bareland_pct = Column(Float, nullable=False)
    classification_map_path = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    dataset = relationship("DatasetModel", back_populates="lulc_runs")


class ChangeDetectionRunModel(Base):
    """Multi-temporal change detection run results."""
    __tablename__ = "change_detection_runs"

    id = Column(String(64), primary_key=True)
    t1_dataset_id = Column(String(64), ForeignKey("datasets.id"), nullable=True)
    t2_dataset_id = Column(String(64), ForeignKey("datasets.id"), nullable=True)
    transition_matrix = Column(JSON, nullable=False) # 5x5 matrix
    net_changes = Column(JSON, nullable=False)
    difference_map_path = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class RAGDocumentModel(Base):
    """Ingested domain knowledge documents."""
    __tablename__ = "rag_documents"

    id = Column(String(64), primary_key=True)
    document_name = Column(String(255), nullable=False)
    doc_type = Column(String(50), nullable=False)
    tag = Column(String(100), default="Domain")
    num_chunks = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    chunks = relationship("RAGDocumentChunkModel", back_populates="document", cascade="all, delete-orphan")


class RAGDocumentChunkModel(Base):
    """Chunks with dense embeddings."""
    __tablename__ = "rag_document_chunks"

    id = Column(String(64), primary_key=True)
    document_id = Column(String(64), ForeignKey("rag_documents.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document = relationship("RAGDocumentModel", back_populates="chunks")
