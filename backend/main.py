import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import logger
from app.core.database import db_manager
from app.core.errors import http_exception_handler, generic_exception_handler
from app.api.v1.api_router import api_router
from app.services.rag_service import rag_service
from app.models.schemas import HealthResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    
    # Auto-generate sample data if missing
    sample_boundary = os.path.join(settings.SAMPLE_DATA_DIR, "study_area_boundary.geojson")
    if not os.path.exists(sample_boundary):
        try:
            from scripts.generate_sample_data import generate_sample_satellite_scenes
            generate_sample_satellite_scenes()
            logger.info("Sample satellite datasets and GeoJSON initialized.")
        except Exception as e:
            logger.warning(f"Sample data generation notice: {e}")

    # Auto-index default knowledge base documents
    kb_files = [f for f in os.listdir(settings.KNOWLEDGE_BASE_DIR) if f.endswith((".md", ".txt", ".pdf"))]
    if len(rag_service.documents) == 0 and kb_files:
        logger.info(f"Indexing {len(kb_files)} initial domain knowledge documents into RAG...")
        for f in kb_files:
            fpath = os.path.join(settings.KNOWLEDGE_BASE_DIR, f)
            rag_service.ingest_document(fpath, doc_tag="Academic Literature")

    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")

app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Satellite Image Processing, GIS Analytics and RAG-Based Geospatial Decision Support System",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directories for image serving
app.mount("/api/v1/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/api/v1/processed", StaticFiles(directory=settings.PROCESSED_DIR), name="processed")
app.mount("/api/v1/samples", StaticFiles(directory=settings.SAMPLE_DATA_DIR), name="samples")

# Include Modular API Routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/health", response_model=HealthResponse, tags=["Health"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    db_status = db_manager.check_extensions()
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        services={
            "dip_engine": True,
            "rs_engine": True,
            "gis_engine": True,
            "lulc_engine": True,
            "rag_vector_store": len(rag_service.documents) > 0,
            "gemini_api": bool(settings.GEMINI_API_KEY),
            "postgresql": db_status["postgresql"],
            "postgis": db_status["postgis"],
            "pgvector": db_status["pgvector"]
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.APP_DEBUG)
