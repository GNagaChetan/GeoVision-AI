from fastapi import APIRouter
from app.api.v1.endpoints import (
    image_processing,
    remote_sensing,
    gis,
    lulc,
    rag,
    ask_geovision
)

api_router = APIRouter()

api_router.include_router(image_processing.router, prefix="/image-processing", tags=["Digital Image Processing"])
api_router.include_router(remote_sensing.router, prefix="/remote-sensing", tags=["Remote Sensing"])
api_router.include_router(gis.router, prefix="/gis", tags=["GIS & Spatial Analytics"])
api_router.include_router(lulc.router, prefix="/lulc", tags=["Land Use Land Cover (LULC)"])
api_router.include_router(rag.router, prefix="/rag", tags=["RAG & Knowledge Base"])
api_router.include_router(ask_geovision.router, prefix="/ask-geovision", tags=["Ask GeoVision Decision Support"])
