from fastapi import APIRouter
from app.api.v1.endpoints import (
    image_processing,
    remote_sensing,
    gis,
    lulc,
    vegetation,
    analytics,
    change_detection,
    rag,
    ask_geovision,
    reports,
    auth
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])

api_router.include_router(image_processing.router, prefix="/image-processing", tags=["Digital Image Processing"])
api_router.include_router(remote_sensing.router, prefix="/remote-sensing", tags=["Remote Sensing"])
api_router.include_router(gis.router, prefix="/gis", tags=["GIS & Spatial Analytics"])
api_router.include_router(lulc.router, prefix="/lulc", tags=["Land Use Land Cover (LULC)"])
api_router.include_router(vegetation.router, prefix="/vegetation", tags=["Multispectral Vegetation Analytics"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Geospatial Data Analytics"])
api_router.include_router(change_detection.router, prefix="/change-detection", tags=["Multi-Date Change Detection"])
api_router.include_router(rag.router, prefix="/rag", tags=["RAG & Knowledge Base"])
api_router.include_router(ask_geovision.router, prefix="/ask-geovision", tags=["Ask GeoVision Decision Support"])
api_router.include_router(reports.router, prefix="/reports", tags=["Automated Geospatial Reports"])
