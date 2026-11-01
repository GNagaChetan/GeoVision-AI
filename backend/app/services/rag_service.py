import os
import json
import re
import math
import datetime
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pypdf import PdfReader
from app.core.config import settings
from app.models.schemas import (
    DocumentIngestionResponse,
    RAGChunkCitation,
    RAGQueryResponse
)

class RAGService:
    """
    Retrieval-Augmented Generation (RAG) Engine for Geospatial AI.
    Features:
    - Multi-format document ingestion (PDF, Markdown, TXT)
    - Sliding window semantic chunking with metadata extraction
    - Prompt injection defense & untrusted document content sanitization
    - TF-IDF Sparse Embedding & Vector Cosine Similarity Search
    - Support for Project Analytical Report auto-indexing
    - Granular Document Deletion & Index Rebuilding
    """

    # Prompt injection patterns to neutralize in untrusted ingested documents
    INJECTION_PATTERNS = [
        r'ignore\s+(all\s+)?previous\s+instructions?',
        r'system\s+prompt\s+override',
        r'you\s+are\s+now\s+in\s+developer\s+mode',
        r'disregard\s+system\s+instructions?',
        r'override\s+system\s+role',
        r'<\s*script[^>]*>.*?<\s*/\s*script\s*>',
        r'\[\s*system_instruction\s*\]'
    ]

    def __init__(self):
        self.chunks_db_file = os.path.join(settings.VECTOR_STORE_PATH, "chunks_db.json")
        self.vectors_file = os.path.join(settings.VECTOR_STORE_PATH, "vectors.npy")
        self.documents: List[Dict[str, Any]] = []
        self.vectors: Optional[np.ndarray] = None
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self._load_store()

    def _load_store(self):
        """Load stored chunks and vector representations if available."""
        if os.path.exists(self.chunks_db_file):
            try:
                with open(self.chunks_db_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.documents = data.get("documents", [])
                    self.vocabulary = data.get("vocabulary", {})
                    self.idf = data.get("idf", {})
            except Exception as e:
                print(f"Error loading RAG chunks DB: {e}")

        if os.path.exists(self.vectors_file):
            try:
                self.vectors = np.load(self.vectors_file)
            except Exception as e:
                print(f"Error loading RAG vectors: {e}")

    def _save_store(self):
        """Persist chunks and vectors to disk."""
        os.makedirs(settings.VECTOR_STORE_PATH, exist_ok=True)
        data = {
            "documents": self.documents,
            "vocabulary": self.vocabulary,
            "idf": self.idf
        }
        with open(self.chunks_db_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        if self.vectors is not None:
            np.save(self.vectors_file, self.vectors)

    # -------------------------------------------------------------
    # Text Extraction & Prompt Injection Sanitization
    # -------------------------------------------------------------
    def sanitize_untrusted_text(self, text: str) -> str:
        """Neutralize malicious prompt injection patterns while preserving academic content."""
        clean = text
        for pat in self.INJECTION_PATTERNS:
            clean = re.sub(pat, '[CONTENT REDACTED: SECURITY POLICY]', clean, flags=re.IGNORECASE)
        # Normalize whitespace
        clean = re.sub(r'[\r\n\t]+', ' ', clean)
        clean = re.sub(r'\s{2,}', ' ', clean).strip()
        return clean

    def extract_text_from_file(self, file_path: str) -> List[Tuple[int, str]]:
        """Extract text with page/section numbers from PDF, MD, or TXT."""
        ext = os.path.splitext(file_path)[1].lower()
        extracted_pages: List[Tuple[int, str]] = []

        if ext == ".pdf":
            try:
                reader = PdfReader(file_path)
                for i, page in enumerate(reader.pages):
                    raw_txt = page.extract_text() or ""
                    sanitized = self.sanitize_untrusted_text(raw_txt)
                    if sanitized:
                        extracted_pages.append((i + 1, sanitized))
            except Exception as e:
                raise ValueError(f"Failed to parse PDF document: {e}")
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()
            # Split markdown/text by major section headers (# or \n\n)
            sections = re.split(r'\n(?=#{1,3}\s)', full_text)
            for idx, sec in enumerate(sections):
                sanitized = self.sanitize_untrusted_text(sec)
                if sanitized:
                    extracted_pages.append((idx + 1, sanitized))

        return extracted_pages

    # -------------------------------------------------------------
    # Semantic Sliding-Window Chunking
    # -------------------------------------------------------------
    def chunk_text(self, text: str, chunk_size: int = 450, overlap: int = 75) -> List[str]:
        """Sliding window semantic chunker with word boundary preservation."""
        if len(text) <= chunk_size:
            return [text] if len(text.strip()) > 20 else []

        words = text.split(' ')
        chunks = []
        cur_words = []
        cur_len = 0

        for word in words:
            cur_words.append(word)
            cur_len += len(word) + 1
            if cur_len >= chunk_size:
                chunks.append(' '.join(cur_words))
                # Keep overlap words
                overlap_words = []
                overlap_len = 0
                for w in reversed(cur_words):
                    overlap_words.insert(0, w)
                    overlap_len += len(w) + 1
                    if overlap_len >= overlap:
                        break
                cur_words = overlap_words
                cur_len = overlap_len

        if cur_words and len(' '.join(cur_words).strip()) > 20:
            chunks.append(' '.join(cur_words))

        return chunks

    # -------------------------------------------------------------
    # Vector Representation & Embedding Indexing
    # -------------------------------------------------------------
    def _build_tfidf_index(self):
        """Compute sparse term frequency-inverse document frequency vectors for local embedding."""
        if not self.documents:
            self.vocabulary = {}
            self.idf = {}
            self.vectors = None
            self._save_store()
            return

        # 1. Build Vocabulary
        vocab = {}
        doc_tokens_list = []
        for doc in self.documents:
            tokens = re.findall(r'[a-zA-Z0-9_-]{2,}', doc["text"].lower())
            doc_tokens_list.append(tokens)
            for t in tokens:
                if t not in vocab:
                    vocab[t] = len(vocab)
        self.vocabulary = vocab

        # 2. Compute IDF
        N = len(self.documents)
        df = {}
        for tokens in doc_tokens_list:
            unique_tokens = set(tokens)
            for t in unique_tokens:
                df[t] = df.get(t, 0) + 1

        self.idf = {t: math.log((N + 1) / (df[t] + 1)) + 1.0 for t in vocab}

        # 3. Vectorize all docs
        mat = np.zeros((N, len(vocab)), dtype=np.float32)
        for i, tokens in enumerate(doc_tokens_list):
            for t in tokens:
                if t in vocab:
                    mat[i, vocab[t]] += 1.0
            # Apply TF-IDF & L2 Normalization
            for t in set(tokens):
                if t in vocab:
                    mat[i, vocab[t]] *= self.idf[t]
            norm = np.linalg.norm(mat[i])
            if norm > 0:
                mat[i] /= norm

        self.vectors = mat
        self._save_store()

    def ingest_document(self, file_path: str, doc_tag: str = "Domain") -> DocumentIngestionResponse:
        """Ingest document, chunk it with metadata, and add to the vector store."""
        filename = os.path.basename(file_path)
        pages = self.extract_text_from_file(file_path)
        new_chunks = 0
        total_chars = 0
        doc_type = os.path.splitext(filename)[1].upper().replace(".", "") or "TXT"
        upload_time = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Remove existing chunks for this file if re-ingesting
        self.documents = [d for d in self.documents if d.get("document_name") != filename]

        for page_num, text in pages:
            chunks = self.chunk_text(text)
            for chunk in chunks:
                if len(chunk.strip()) > 20:
                    self.documents.append({
                        "document_name": filename,
                        "filename": filename,
                        "source": file_path,
                        "page_number": page_num,
                        "chunk_index": len(self.documents),
                        "character_count": len(chunk),
                        "doc_type": doc_type,
                        "upload_time": upload_time,
                        "text": chunk,
                        "tag": doc_tag
                    })
                    new_chunks += 1
                    total_chars += len(chunk)

        self._build_tfidf_index()

        return DocumentIngestionResponse(
            filename=filename,
            doc_type=doc_type,
            num_chunks=new_chunks,
            character_count=total_chars,
            status="Indexed & Embedded"
        )

    def index_project_report(self, report_dict: Dict[str, Any]) -> int:
        """Index a project-generated analytical report so RAG can answer queries about the active project."""
        report_title = report_dict.get("project_title", "GeoVision Analytical Report")
        filename = f"Project_Report_{report_dict.get('report_id', 'latest')}.json"
        
        # Structure sections as distinct chunks
        chunks_to_add = []
        
        # Section 1: Study Area & Executive Summary
        summary_text = (
            f"Project: {report_title}. Generated at: {report_dict.get('generated_at', '')}. "
            f"Study Area: {report_dict.get('study_area_name', 'Active Study Area')}. "
            f"Total Area: {report_dict.get('total_area_ha', 0.0)} ha ({report_dict.get('total_area_km2', 0.0)} km²). "
            f"Dominant Land Cover: {report_dict.get('dominant_class', 'Vegetation')}. "
            f"Sensor Provenance: Sentinel-2 MSI Level-2A surface reflectance."
        )
        chunks_to_add.append((1, summary_text))
        
        # Section 2: LULC Class Metrics
        if "lulc_metrics" in report_dict:
            classes_str = ", ".join([
                f"{c.get('class_name', '')}: {c.get('area_hectares', 0)} ha ({c.get('percentage', 0)}%)"
                for c in report_dict["lulc_metrics"]
            ])
            lulc_text = f"LULC 5-Class Classification Results for {report_title}: {classes_str}."
            chunks_to_add.append((2, lulc_text))
            
        # Section 3: Multi-Temporal Change Dynamics
        if "change_detection" in report_dict:
            cd = report_dict["change_detection"]
            cd_text = (
                f"Multi-Temporal Change Detection (2020 Baseline to 2025 Recent): "
                f"Total Unchanged Area: {cd.get('unchanged_area_ha', 0)} ha ({cd.get('unchanged_percentage', 0)}%). "
                f"Total Changed Area: {cd.get('total_changed_area_ha', 0)} ha ({cd.get('total_changed_percentage', 0)}%). "
                f"Main Conversion: Agriculture converted to Vegetation ({cd.get('most_converted_transition', {}).get('area_ha', 0)} ha)."
            )
            chunks_to_add.append((3, cd_text))

        upload_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
        self.documents = [d for d in self.documents if d.get("document_name") != filename]

        for sec_num, text in chunks_to_add:
            self.documents.append({
                "document_name": filename,
                "filename": filename,
                "source": "Project Analysis Report",
                "page_number": sec_num,
                "chunk_index": len(self.documents),
                "character_count": len(text),
                "doc_type": "PROJECT_REPORT",
                "upload_time": upload_time,
                "text": text,
                "tag": "Project Report"
            })

        self._build_tfidf_index()
        return len(chunks_to_add)

    def delete_document(self, document_name: str) -> bool:
        """Remove all chunks associated with a document and recompute vector index."""
        orig_len = len(self.documents)
        self.documents = [d for d in self.documents if d.get("document_name") != document_name]
        if len(self.documents) < orig_len:
            self._build_tfidf_index()
            # Also remove physical file if in knowledge base directory
            target_file = os.path.join(settings.KNOWLEDGE_BASE_DIR, document_name)
            if os.path.exists(target_file):
                try:
                    os.remove(target_file)
                except Exception:
                    pass
            return True
        return False

    # -------------------------------------------------------------
    # Vector Search & Retrieval
    # -------------------------------------------------------------
    def search(self, query: str, top_k: int = 4, filter_tag: Optional[str] = None) -> List[RAGChunkCitation]:
        """Search top-k matching chunks with cosine similarity ranking."""
        if not self.documents or self.vectors is None or len(self.vocabulary) == 0:
            return []

        # Vectorize query
        q_vec = np.zeros(len(self.vocabulary), dtype=np.float32)
        tokens = re.findall(r'[a-zA-Z0-9_-]{2,}', query.lower())
        for t in tokens:
            if t in self.vocabulary:
                q_vec[self.vocabulary[t]] = q_vec[self.vocabulary[t]] + (1.0 * self.idf[t])

        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []
        q_vec /= q_norm

        # Cosine similarities
        scores = np.dot(self.vectors, q_vec)
        ranked_indices = np.argsort(-scores)

        citations = []
        for idx in ranked_indices:
            if scores[idx] <= 0.04:
                break
            doc = self.documents[idx]
            if filter_tag and doc.get("tag") != filter_tag:
                continue

            citations.append(RAGChunkCitation(
                document_name=doc["document_name"],
                page_number=doc.get("page_number"),
                chunk_index=doc["chunk_index"],
                similarity_score=round(float(scores[idx]), 3),
                snippet=doc["text"]
            ))

            if len(citations) >= top_k:
                break

        return citations

rag_service = RAGService()
