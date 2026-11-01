"""
Database Migration and Table Provisioning Script.
Executes database table creation and PostGIS extension verification.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from sqlalchemy import text
from app.core.database import db_manager, Base
from app.models.db_models import (
    DatasetModel, StudyAreaModel, VectorLayerModel,
    SpatialFeatureModel, RasterLayerModel, LULCClassificationModel,
    ChangeDetectionRunModel, RAGDocumentModel, RAGDocumentChunkModel
)
from app.core.logging import logger

def run_migrations():
    print("Running GeoVision AI Database Migrations...")
    if not db_manager.is_connected or not db_manager.engine:
        print("[NOTICE] PostgreSQL connection is not active. Using persistent local file/memory fallback storage.")
        return False

    try:
        with db_manager.engine.connect() as conn:
            # 1. Enable PostGIS & Vector extensions
            print("Enabling PostGIS and pgvector extensions...")
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_topology;"))
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                print("[SUCCESS] PostGIS and pgvector extensions enabled.")
            except Exception as ext_err:
                print(f"Extension note: {ext_err}")
                conn.rollback()

        # 2. Create tables via SQLAlchemy metadata
        print("Creating database tables via SQLAlchemy metadata...")
        Base.metadata.create_all(bind=db_manager.engine)
        print("[SUCCESS] All database tables created successfully.")
        return True
    except Exception as e:
        print(f"Migration error: {e}")
        return False

if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
