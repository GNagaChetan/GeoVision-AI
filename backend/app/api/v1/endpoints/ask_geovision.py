from fastapi import APIRouter, HTTPException, status
from typing import Optional, Dict, Any
from app.services.llm_service import ask_geovision_service
from app.models.schemas import AskGeoVisionRequest, AskGeoVisionResponse

router = APIRouter()

@router.post("/chat", response_model=AskGeoVisionResponse)
async def ask_geovision(
    request: AskGeoVisionRequest
):
    """
    Intelligent Geospatial Decision Support Assistant.
    Combines active map metrics, RAG knowledge retrieval, structured GIS operations,
    and grounded LLM reasoning.
    """
    if not request.prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question prompt cannot be empty."
        )

    try:
        response = ask_geovision_service.execute_decision_query(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Decision support query error: {str(e)}"
        )
