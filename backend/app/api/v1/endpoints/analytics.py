from fastapi import APIRouter, HTTPException, status
from app.services.analytics_service import analytics_service
from app.models.schemas import AnalyticsDashboardResponse

router = APIRouter()

@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
async def get_analytics_dashboard():
    """
    Retrieve comprehensive geospatial analytics dashboard metrics
    (KPI cards, LULC area distribution, multi-year comparisons, NDVI summaries, and net transitions).
    """
    try:
        return analytics_service.get_dashboard_analytics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Analytics computation error: {str(e)}"
        )
