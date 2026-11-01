# GeoVision AI — Security Audit & Threat Model Report
**Version:** 1.0.0 (Production Release)  
**Date:** October 2026  
**Status:** Passed — Strict Hardening Applied

---

## 1. Executive Summary
GeoVision AI was subjected to an exhaustive architectural and code-level security audit across all 13 operational phases. The audit evaluated the Frontend (React + TypeScript), Backend (FastAPI), Database (PostGIS + pgvector), Remote Sensing & Digital Image Processing pipelines, RAG Knowledge Base, and the Ask GeoVision Decision Support Assistant.

All critical attack vectors—including **Arbitrary SQL Execution via LLM**, **Prompt Injection in Document RAG**, **Path Traversal**, **Unsafe GeoJSON/Raster Ingestion**, and **API Key Exposure**—have been neutralized through deterministic validation layers, sandboxed query execution, and multi-tier input sanitization.

---

## 2. Comprehensive Security Check Matrix (16 Key Audit Points)

| # | Security Area | Risk Assessed | Mitigation / Architecture Implementation | Audit Status |
|---|---|---|---|---|
| **1** | **Hardcoded Secrets** | Accidental credential leakage in source code | Zero secrets committed. All credentials (`POSTGRES_PASSWORD`, `GEMINI_API_KEY`) are dynamically resolved from environment variables (`.env`). Default fallback values are strictly limited to local dev dummies. | **VERIFIED CLEAN** |
| **2** | **Frontend API Key Exposure** | Client-side scraping of Gemini / LLM keys | The React/Vite frontend holds zero private API keys. All LLM synthesis and RAG vector searches execute exclusively server-side via FastAPI backend proxy endpoints (`/api/v1/ask-geovision` and `/api/v1/rag/query`). | **SECURE** |
| **3** | **SQL Injection** | Malicious injection in spatial queries | No dynamic raw SQL string interpolation. All database interactions leverage SQLAlchemy ORM and parameterized asyncpg queries with PostGIS function wrappers. | **SECURE** |
| **4** | **Arbitrary SQL via LLM** | LLM hallucinating or executing destructive SQL (`DROP TABLE`, `DELETE`) | **Zero direct LLM-to-SQL execution.** The LLM is restricted to returning high-level structured intent tokens. Operations pass through `ValidatedStructuredQueryEngine` with a strict compile-time allowlist. | **SECURE** |
| **5** | **Path Traversal** | `../` or absolute path injection in file operations | Uploaded files and report IDs are strictly sanitized via `secure_filename()` / `os.path.basename()`. File lookup is confined to sandboxed directories (`uploads/`, `data/sample_datasets/`, `data/reports/`). | **PROTECTED** |
| **6** | **Unsafe File Uploads** | Remote code execution via executable uploads | Ingestion validates strict MIME types and file extensions: `.tif`, `.tiff`, `.png`, `.jpg`, `.jpeg`, `.geojson`, `.json`, `.pdf`, `.txt`, `.md`. Magic bytes and raster headers are checked before disk writing. | **PROTECTED** |
| **7** | **Malicious Document Ingestion** | Embedded macro or buffer overflow in PDF/TXT | PDF text extraction utilizes isolated `pypdf` stream readers with character extraction limits and error trapping. Corrupted streams are rejected before vector embedding. | **PROTECTED** |
| **8** | **Prompt Injection in RAG** | Ingested documents attempting to override system instructions | Regex-based active filtering (`INJECTION_PATTERNS`) detects and redacts malicious directives (`IGNORE ALL PREVIOUS INSTRUCTIONS`, `SYSTEM PROMPT OVERRIDE`, etc.). Ingested chunks are wrapped in untrusted context delimiters with strict system instruction dominance. | **PROTECTED** |
| **9** | **Unsafe LLM-Generated GIS Operations** | Out-of-bounds spatial buffers or geometric attacks | Buffer distances and spatial parameters are validated against numeric bounds (`0 < distance_m <= 100,000`). Unsupported spatial operations throw immediate `ValueError` exceptions before GIS engine execution. | **PROTECTED** |
| **10** | **CORS Configuration** | Unauthorized cross-origin resource access | FastApi `CORSMiddleware` explicitly whitelists configured origins (`http://localhost:5173`, `http://localhost:3000`). Wildcard `*` is disabled in production environments. | **CONFIGURED** |
| **11** | **Input Validation** | Malformed parameters causing backend crashes | Exhaustive Pydantic v2 schemas validate all REST request payloads. Filter kernels are constrained to odd positive integers ($3, 5, 7$); thresholds are bounded in $[0, 255]$; NDVI values are validated in $[-1.0, 1.0]$. | **ENFORCED** |
| **12** | **Output Validation** | Data leakage or non-deterministic serialization | Strict response models serialize all API outputs, stripping internal database connection strings and sensitive file system metadata. | **ENFORCED** |
| **13** | **Oversized File Uploads** | Resource exhaustion and Denial of Service (DoS) | A hard limit of **25 MB per file** is enforced at the FastAPI router and Nginx reverse-proxy layers. Stream buffers prevent memory exhaustion. | **ENFORCED** |
| **14** | **Unsafe Raster Processing** | Integer overflow, zero-division, or memory bombs | Raster arrays are bounded to maximum dimensions ($4096 \times 4096$). All division operations (NDVI, PSNR, SSIM, Histogram equalization) include numerical stabilization $\epsilon = 1e-7$ to prevent division by zero or NaN propagation. | **PROTECTED** |
| **15** | **Unsafe GeoJSON Processing** | Self-intersecting rings or infinite coordinate loops | Shapely `make_valid()` and custom topological repair routines fix unclosed rings, collinear spikes, and invalid vertex winding orders before computing geodesic metrics. | **PROTECTED** |
| **16** | **Production Debug Exposure** | Stack trace and internal architecture leaking | FastAPI exception handlers catch uncaught exceptions and return standardized error objects (`GeoVisionAPIError`) with sanitized messages, suppressing tracebacks in production mode (`APP_DEBUG=false`). | **PROTECTED** |

---

## 3. Sandboxed Structured Query Engine (No Arbitrary SQL)

GeoVision AI enforces an architectural boundary between the LLM and the database/computational engine. The LLM acts purely as a semantic intent parser; it has **no access to database connections, filesystem handles, or shell commands**.

```
User Query: "What percentage of the study area is vegetation?"
       ↓
[Ask GeoVision Router] → Matches Intent: "lulc_area"
       ↓
[ValidatedStructuredQueryEngine]
       ├── Check Operation in Allowlist:
       │     ["lulc_area", "study_area_stats", "change_detection_loss",
       │      "buffer_intersection", "ndvi_statistics", "rag_knowledge_lookup"]
       │     → ALLOWED
       ├── Validate Parameters: {"class": "vegetation"}
       └── Execute Pure Python/GIS Algorithm (No SQL Concatenation)
       ↓
[Verified Numeric Response] → Injected into Grounded Context
```

Any attempted operation outside the allowlist (e.g., `execute_sql`, `drop_table`, `read_file`) raises an immediate, unhandled `ValueError`, completely preventing injection attacks.

---

## 4. Prompt Injection Defense in RAG

When indexing untrusted documents (user-uploaded PDFs, reports, or text files), the RAG service processes each text chunk through the `sanitize_untrusted_text` pipeline:

```python
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?previous\s+instructions",
    r"(?i)system\s+prompt\s+override",
    r"(?i)you\s+are\s+now\s+in\s+developer\s+mode",
    r"(?i)disregard\s+all\s+prior\s+guidelines",
    r"(?i)forget\s+(all\s+)?your\s+rules",
    r"(?i)bypass\s+safety\s+filter",
]
```

Matched patterns are replaced with `[CONTENT REDACTED: SECURITY POLICY]`. Furthermore, the LLM prompt encapsulates retrieved context in isolated XML/Markdown boundary blocks, instructing the model that context is passive factual reference and cannot alter system roles.

---

## 5. Known Limitations & Recommended Future Hardening

1. **Authentication & Multi-Tenancy**: The current release is structured for single-tenant research and institutional deployments. For public multi-user deployments, integrate OAuth2 / JWT bearer authentication and Row-Level Security (RLS) in PostgreSQL.
2. **Rate Limiting**: Add Redis-backed token-bucket rate limiting (e.g., `slowapi`) to public endpoints to guard against high-frequency API abuse.
3. **ClamAV Antivirus Integration**: In high-throughput enterprise setups, pipe uploaded raster and PDF streams through an active antivirus scanner before storage.
