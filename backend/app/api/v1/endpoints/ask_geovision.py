import os
import shutil
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from typing import Optional, Dict, Any
from app.core.config import settings
from app.services.llm_service import ask_geovision_service
from app.services.rag_service import rag_service
from app.models.schemas import AskGeoVisionRequest, AskGeoVisionResponse

router = APIRouter()

@router.post("/chat", response_model=AskGeoVisionResponse)
async def ask_geovision(request: AskGeoVisionRequest):
    """
    Intelligent Geospatial Decision Support Assistant.
    Provides targeted, clean plain-English answers grounded in verified satellite data.
    """
    if not request.prompt.strip() and not request.image_url and not request.document_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question prompt or attachment cannot be empty."
        )

    try:
        response = ask_geovision_service.execute_decision_query(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Decision support query error: {str(e)}"
        )

@router.post("/upload-picture")
async def upload_chat_picture(file: UploadFile = File(...)):
    """Upload a picture or satellite tile directly to the AI Assistant for visual analysis."""
    allowed_exts = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{ext}'. Supported: {', '.join(allowed_exts)}"
        )

    safe_filename = f"chat_img_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size_kb = round(os.path.getsize(dest_path) / 1024, 1)
        url_path = f"/api/v1/uploads/{safe_filename}"
        return {
            "success": True,
            "filename": file.filename,
            "image_url": url_path,
            "url": url_path,
            "file_size_kb": file_size_kb,
            "message": "Picture uploaded and ready for AI analysis."
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Image upload failed: {e}")

@router.post("/upload-document")
async def upload_chat_document(file: UploadFile = File(...)):
    """Upload a document (PDF, TXT, MD) directly to the AI Assistant to index into RAG."""
    allowed_exts = {".pdf", ".txt", ".md"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document format '{ext}'. Supported: .pdf, .txt, .md"
        )

    safe_filename = f"doc_{uuid.uuid4().hex[:8]}_{file.filename}"
    dest_path = os.path.join(settings.KNOWLEDGE_BASE_DIR, safe_filename)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Ingest into RAG service
        ingest_res = rag_service.ingest_document(dest_path, doc_tag="User Chat Upload")
        return {
            "success": True,
            "filename": file.filename,
            "document_name": safe_filename,
            "chunks_indexed": ingest_res.num_chunks,
            "character_count": ingest_res.character_count,
            "message": f"Document '{file.filename}' successfully indexed into knowledge base."
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Document indexing failed: {e}")
