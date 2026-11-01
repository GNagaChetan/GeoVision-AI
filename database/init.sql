-- ===================================================
-- GeoVision AI - Database Initialization Script
-- PostgreSQL 16 + PostGIS 3.4 + pgvector
-- ===================================================

-- 1. Enable Spatial and Vector Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify PostGIS Version
DO $$
BEGIN
    RAISE NOTICE 'PostGIS Version: %', postgis_full_version();
END $$;

-- 2. Datasets Table (Satellite Scenes & Multispectral Bundles)
CREATE TABLE IF NOT EXISTS datasets (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sensor VARCHAR(100) NOT NULL,            -- e.g. 'Sentinel-2 MSI'
    spatial_resolution_m DOUBLE PRECISION NOT NULL, -- e.g. 10.0
    acquisition_date DATE NOT NULL,
    crs VARCHAR(50) DEFAULT 'EPSG:4326',
    file_path TEXT NOT NULL,
    is_sample_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Study Areas Table (Geodesic Vector Polygons)
CREATE TABLE IF NOT EXISTS study_areas (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dataset_id VARCHAR(64) REFERENCES datasets(id) ON DELETE SET NULL,
    boundary_geom GEOMETRY(Polygon, 4326),
    boundary_geojson JSONB NOT NULL,
    area_hectares DOUBLE PRECISION NOT NULL,
    area_sq_km DOUBLE PRECISION NOT NULL,
    perimeter_meters DOUBLE PRECISION NOT NULL,
    centroid_lat DOUBLE PRECISION,
    centroid_lon DOUBLE PRECISION,
    bbox JSONB,                              -- [minx, miny, maxx, maxy]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_study_areas_geom ON study_areas USING GIST (boundary_geom);

-- 4. Vector Layers Table
CREATE TABLE IF NOT EXISTS vector_layers (
    id VARCHAR(64) PRIMARY KEY,
    study_area_id VARCHAR(64) REFERENCES study_areas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(50) NOT NULL,         -- 'polygon', 'point', 'linestring', 'multipolygon', 'feature_collection'
    feature_count INTEGER NOT NULL DEFAULT 0,
    crs VARCHAR(50) DEFAULT 'EPSG:4326',
    style_config JSONB DEFAULT '{}'::jsonb,  -- {fill_color, stroke_color, stroke_width, opacity, fill_opacity}
    visible BOOLEAN DEFAULT TRUE,
    z_index INTEGER DEFAULT 0,
    geojson_data JSONB NOT NULL,
    geom_collection GEOMETRY(GeometryCollection, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vector_layers_geom ON vector_layers USING GIST (geom_collection);
CREATE INDEX IF NOT EXISTS idx_vector_layers_study_area ON vector_layers (study_area_id);

-- 5. Spatial Features Table (Individual PostGIS Features)
CREATE TABLE IF NOT EXISTS spatial_features (
    id VARCHAR(64) PRIMARY KEY,
    layer_id VARCHAR(64) REFERENCES vector_layers(id) ON DELETE CASCADE,
    feature_index INTEGER DEFAULT 0,
    properties JSONB DEFAULT '{}'::jsonb,
    geom GEOMETRY(Geometry, 4326),
    area_ha DOUBLE PRECISION,
    perimeter_m DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_spatial_features_geom ON spatial_features USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_spatial_features_layer ON spatial_features (layer_id);

-- 6. Raster Layers Table
CREATE TABLE IF NOT EXISTS raster_layers (
    id VARCHAR(64) PRIMARY KEY,
    study_area_id VARCHAR(64) REFERENCES study_areas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    crs VARCHAR(50) DEFAULT 'EPSG:4326',
    spatial_resolution_m DOUBLE PRECISION,
    width INTEGER,
    height INTEGER,
    band_count INTEGER DEFAULT 1,
    bounds_wgs84 JSONB,                      -- [min_lon, min_lat, max_lon, max_lat]
    colormap VARCHAR(50) DEFAULT 'grayscale',
    opacity DOUBLE PRECISION DEFAULT 1.0,
    visible BOOLEAN DEFAULT TRUE,
    z_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_raster_layers_study_area ON raster_layers (study_area_id);

-- 7. Land Use Land Cover (LULC) Classifications Table
CREATE TABLE IF NOT EXISTS lulc_classifications (
    id VARCHAR(64) PRIMARY KEY,
    dataset_id VARCHAR(64) REFERENCES datasets(id) ON DELETE CASCADE,
    total_area_ha DOUBLE PRECISION NOT NULL,
    vegetation_ha DOUBLE PRECISION NOT NULL,
    vegetation_pct DOUBLE PRECISION NOT NULL,
    water_ha DOUBLE PRECISION NOT NULL,
    water_pct DOUBLE PRECISION NOT NULL,
    builtup_ha DOUBLE PRECISION NOT NULL,
    builtup_pct DOUBLE PRECISION NOT NULL,
    agriculture_ha DOUBLE PRECISION NOT NULL,
    agriculture_pct DOUBLE PRECISION NOT NULL,
    bareland_ha DOUBLE PRECISION NOT NULL,
    bareland_pct DOUBLE PRECISION NOT NULL,
    classification_map_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Multi-Temporal Change Detection Runs Table
CREATE TABLE IF NOT EXISTS change_detection_runs (
    id VARCHAR(64) PRIMARY KEY,
    t1_dataset_id VARCHAR(64) REFERENCES datasets(id),
    t2_dataset_id VARCHAR(64) REFERENCES datasets(id),
    transition_matrix JSONB NOT NULL,        -- 5x5 matrix in hectares
    net_changes JSONB NOT NULL,              -- Per-class gain/loss metrics
    difference_map_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. RAG Domain Knowledge Documents Table
CREATE TABLE IF NOT EXISTS rag_documents (
    id VARCHAR(64) PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) NOT NULL,           -- 'PDF', 'MD', 'TXT'
    tag VARCHAR(100) DEFAULT 'Domain',
    num_chunks INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. RAG Chunks with Vector Embeddings Table
CREATE TABLE IF NOT EXISTS rag_document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES rag_documents(id) ON DELETE CASCADE,
    page_number INTEGER,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768),                   -- pgvector 768-dim dense embedding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON rag_document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
