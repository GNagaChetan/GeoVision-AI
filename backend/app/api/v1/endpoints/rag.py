import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import List, Optional
from app.core.config import settings
from app.core.security import validate_document_upload
from app.services.rag_service import rag_service
from app.models.schemas import (
    DocumentIngestionResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    RAGChunkCitation
)

router = APIRouter()

@router.post("/ingest", response_model=DocumentIngestionResponse)
async def ingest_document(
    file: UploadFile = File(...),
    doc_tag: str = Form("Domain")
):
    """Upload and index a PDF, Markdown, or TXT document into the RAG vector store."""
    clean_name = validate_document_upload(file)
    unique_name = f"{uuid.uuid4().hex[:8]}_{clean_name}"
    dest_path = os.path.join(settings.KNOWLEDGE_BASE_DIR, unique_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        res = rag_service.ingest_document(dest_path, doc_tag)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document ingestion failed: {str(e)}"
        )

@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(request: RAGQueryRequest):
    """Perform vector similarity search against domain knowledge chunks with source citations."""
    citations = rag_service.search(request.query, top_k=request.top_k, filter_tag=request.filter_tag)
    
    # Synthesize grounded snippet response
    if citations:
        answer = f"Found {len(citations)} relevant citations from domain documentation supporting '{request.query}'."
        grounded = True
        context = [c.snippet for c in citations]
    else:
        answer = "No matching knowledge base chunks found for this query."
        grounded = False
        context = []

    return RAGQueryResponse(
        query=request.query,
        answer=answer,
        citations=citations,
        grounded=grounded,
        context_used=context
    )

@router.get("/documents")
async def list_documents():
    """List indexed documents in the RAG knowledge base."""
    unique_docs = {}
    for doc in rag_service.documents:
        name = doc["document_name"]
        if name not in unique_docs:
            unique_docs[name] = {
                "document_name": name,
                "chunks_count": 0,
                "tag": doc.get("tag", "Domain")
            }
        unique_docs[name]["chunks_count"] += 1

    return {
        "total_documents": len(unique_docs),
        "total_chunks": len(rag_service.documents),
        "documents": list(unique_docs.values())
    }

@router.post("/initialize-defaults")
async def initialize_defaults():
    """Ingest pre-loaded knowledge base markdown documents into the RAG index."""
    kb_dir = settings.KNOWLEDGE_BASE_DIR
    files = [f for f in os.listdir(kb_dir) if f.endswith((".md", ".txt", ".pdf"))]
    results = []
    for f in files:
        fpath = os.path.join(kb_dir, f)
        res = rag_service.ingest_document(fpath, doc_tag="Academic Literature")
        results.append(res)
    return {"status": "success", "ingested": results}
