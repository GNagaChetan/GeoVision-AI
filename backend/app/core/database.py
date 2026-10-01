import os
from typing import Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.core.logging import logger

Base = declarative_base()

class DatabaseManager:
    """Manages PostgreSQL + PostGIS + pgvector database connections with resilient fallback."""

    def __init__(self):
        self.db_url = (
            f"postgresql+psycopg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
            f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        )
        self.engine = None
        self.SessionLocal = None
        self.is_connected = False
        self._initialize_engine()

    def _initialize_engine(self):
        try:
            self.engine = create_engine(
                self.db_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"connect_timeout": 3}
            )
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            # Test ping
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1;"))
            self.is_connected = True
            logger.info("Successfully connected to PostgreSQL database.")
        except Exception as e:
            self.is_connected = False
            logger.warning(f"PostgreSQL connection offline (running with local memory/file fallback): {e}")

    def check_extensions(self) -> Dict[str, Any]:
        """Verify PostGIS and pgvector extensions if DB is available."""
        if not self.is_connected or not self.engine:
            return {
                "postgresql": False,
                "postgis": False,
                "pgvector": False,
                "note": "Operating with persistent file storage and in-memory spatial indexes."
            }

        status = {"postgresql": True, "postgis": False, "pgvector": False}
        try:
            with self.engine.connect() as conn:
                # Check PostGIS
                try:
                    res = conn.execute(text("SELECT PostGIS_Full_Version();")).fetchone()
                    if res:
                        status["postgis"] = True
                        status["postgis_version"] = str(res[0])
                except Exception:
                    status["postgis"] = False

                # Check pgvector
                try:
                    res = conn.execute(text("SELECT extversion FROM pg_extension WHERE extname = 'vector';")).fetchone()
                    if res:
                        status["pgvector"] = True
                        status["pgvector_version"] = str(res[0])
                except Exception:
                    status["pgvector"] = False
        except Exception as e:
            logger.error(f"Error checking DB extensions: {e}")

        return status

db_manager = DatabaseManager()

def get_db():
    """Dependency for obtaining a database session."""
    if not db_manager.is_connected or not db_manager.SessionLocal:
        yield None
        return

    db = db_manager.SessionLocal()
    try:
        yield db
    finally:
        db.close()
