from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from app.core.logging import logger

async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP Exception on {request.method} {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error_type": "HTTPException",
            "detail": exc.detail,
            "path": request.url.path
        }
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error_type": type(exc).__name__,
            "detail": "An internal server error occurred while processing the geospatial request.",
            "path": request.url.path
        }
    )
