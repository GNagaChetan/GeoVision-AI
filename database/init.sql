-- ===================================================
-- GeoVision AI - Database Initialization Script
-- PostgreSQL 16 + PostGIS + pgvector
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
    dataset_id VARCHAR(64) REFERENCES datasets(id) ON DELETE CASCADE,
    boundary_geom GEOMETRY(Polygon, 4326) NOT NULL,
    area_hectares DOUBLE PRECISION NOT NULL,
    area_sq_km DOUBLE PRECISION NOT NULL,
    perimeter_meters DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_study_areas_geom ON study_areas USING GIST (boundary_geom);

-- 4. Land Use Land Cover (LULC) Classifications Table
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

-- 5. Multi-Temporal Change Detection Runs Table
CREATE TABLE IF NOT EXISTS change_detection_runs (
    id VARCHAR(64) PRIMARY KEY,
    t1_dataset_id VARCHAR(64) REFERENCES datasets(id),
    t2_dataset_id VARCHAR(64) REFERENCES datasets(id),
    transition_matrix JSONB NOT NULL,        -- 5x5 matrix in hectares
    net_changes JSONB NOT NULL,              -- Per-class gain/loss metrics
    difference_map_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. RAG Domain Knowledge Documents Table
CREATE TABLE IF NOT EXISTS rag_documents (
    id VARCHAR(64) PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) NOT NULL,           -- 'PDF', 'MD', 'TXT'
    tag VARCHAR(100) DEFAULT 'Domain',
    num_chunks INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. RAG Chunks with Vector Embeddings Table
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
