import os
import json
import re
import math
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
    Retrieval-Augmented Generation (RAG) Engine.
    Handles multi-format document ingestion, semantic chunking, embedding generation,
    vector similarity retrieval, and citation mapping.
    """

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
    # Document Text Extraction
    # -------------------------------------------------------------
    def extract_text_from_file(self, file_path: str) -> List[Tuple[int, str]]:
        """Extract text with page/section numbers from PDF, MD, or TXT."""
        ext = os.path.splitext(file_path)[1].lower()
        extracted_pages: List[Tuple[int, str]] = []

        if ext == ".pdf":
            reader = PdfReader(file_path)
            for i, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                extracted_pages.append((i + 1, txt))
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()
            # Split markdown/text by major section headers (# or \n\n)
            sections = re.split(r'\n(?=#{1,3}\s)', full_text)
            for idx, sec in enumerate(sections):
                extracted_pages.append((idx + 1, sec))

        return extracted_pages

    # -------------------------------------------------------------
    # Chunking & Cleaning
    # -------------------------------------------------------------
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        """Sliding window semantic chunker with word boundary preservation."""
        clean_text = re.sub(r'\s+', ' ', text).strip()
        if len(clean_text) <= chunk_size:
            return [clean_text] if clean_text else []

        words = clean_text.split(' ')
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

        if cur_words:
            chunks.append(' '.join(cur_words))

        return chunks

    # -------------------------------------------------------------
    # Vector Representation & Embedding Indexing
    # -------------------------------------------------------------
    def _build_tfidf_index(self):
        """Compute sparse term frequency-inverse document frequency vectors for local embedding."""
        if not self.documents:
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
        """Ingest document, chunk it, and add to the vector store."""
        filename = os.path.basename(file_path)
        pages = self.extract_text_from_file(file_path)
        new_chunks = 0
        total_chars = 0

        for page_num, text in pages:
            chunks = self.chunk_text(text)
            for chunk in chunks:
                if len(chunk.strip()) > 30:
                    self.documents.append({
                        "document_name": filename,
                        "page_number": page_num,
                        "chunk_index": len(self.documents),
                        "text": chunk,
                        "tag": doc_tag
                    })
                    new_chunks += 1
                    total_chars += len(chunk)

        self._build_tfidf_index()

        return DocumentIngestionResponse(
            filename=filename,
            doc_type=os.path.splitext(filename)[1].upper().replace(".", ""),
            num_chunks=new_chunks,
            character_count=total_chars,
            status="Indexed & Embedded"
        )

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
            if scores[idx] <= 0.05:
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
