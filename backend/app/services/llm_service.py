import os
import json
import re
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.rag_service import rag_service
from app.services.gis_service import gis_service
from app.services.lulc_service import lulc_service
from app.models.schemas import (
    AskGeoVisionRequest,
    AskGeoVisionResponse,
    RAGChunkCitation
)

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

class AskGeoVisionService:
    """
    Intelligent Geospatial Decision Support Engine.
    Fuses grounded RAG knowledge, active project analytics, structured GIS operations,
    and Gemini LLM reasoning without arbitrary SQL execution.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.client = None
        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"Failed to initialize Gemini Client: {e}")

    def execute_decision_query(
        self,
        request: AskGeoVisionRequest,
        active_analytics_context: Optional[Dict[str, Any]] = None
    ) -> AskGeoVisionResponse:
        prompt = request.prompt.strip()
        executed_tools: List[str] = []
        structured_analytics: Dict[str, Any] = {}
        map_actions: List[Dict[str, Any]] = []

        # 1. Retrieve RAG Citations
        citations: List[RAGChunkCitation] = []
        if request.include_rag_context:
            citations = rag_service.search(prompt, top_k=3)
            if citations:
                executed_tools.append("rag_vector_search")

        # 2. Parse Structured Intent (Spatial / Analytical / Domain)
        lower_prompt = prompt.lower()
        
        # Check for buffer intent
        buffer_match = re.search(r'buffer.*?(\d+)\s*(m|meter|meters|km)', lower_prompt)
        if buffer_match and active_analytics_context and "active_geojson" in active_analytics_context:
            dist = float(buffer_match.group(1))
            unit = buffer_match.group(2)
            dist_m = dist * 1000.0 if "km" in unit else dist
            try:
                buf_res = gis_service.create_buffer(active_analytics_context["active_geojson"], dist_m)
                structured_analytics["buffer_operation"] = {
                    "distance_meters": dist_m,
                    "buffered_area_ha": buf_res.buffered_area_ha,
                    "original_area_ha": buf_res.original_area_ha
                }
                map_actions.append({
                    "action": "overlay_geojson",
                    "geojson": buf_res.buffered_geojson,
                    "label": f"Buffer Zone ({dist_m}m)"
                })
                executed_tools.append("gis_geodesic_buffer")
            except Exception as e:
                structured_analytics["buffer_error"] = str(e)

        # Check for LULC / Area Query
        if any(w in lower_prompt for w in ["area", "hectares", "percentage", "lulc", "vegetation", "built-up", "water", "urban", "change"]):
            if active_analytics_context and "lulc_metrics" in active_analytics_context:
                structured_analytics["lulc_summary"] = active_analytics_context["lulc_metrics"]
                executed_tools.append("lulc_metrics_inspector")

        # 3. Grounded LLM Response Synthesis
        context_text = ""
        if citations:
            context_text += "\n--- RETRIEVED DOMAIN KNOWLEDGE ---\n"
            for c in citations:
                context_text += f"Source [{c.document_name}, Page {c.page_number}]: {c.snippet}\n"

        if structured_analytics:
            context_text += "\n--- COMPUTED PROJECT METRICS ---\n"
            context_text += json.dumps(structured_analytics, indent=2)

        system_instruction = (
            "You are GeoVision AI, an expert Geospatial Intelligence and Remote Sensing Decision Support Assistant. "
            "Always ground your reasoning in the provided project analytics and retrieved academic citations. "
            "Never fabricate numeric measurements. If specific numbers are computed in the context, cite them precisely. "
            "Provide professional, structured, academic answers."
        )

        response_text = ""
        grounding_status = "Grounded with Project Analytics & RAG Knowledge"

        if self.client:
            try:
                full_prompt = f"{system_instruction}\n\nContext:\n{context_text}\n\nUser Question:\n{prompt}"
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=full_prompt
                )
                response_text = response.text
                executed_tools.append("gemini_reasoning_engine")
            except Exception as e:
                response_text = self._fallback_grounded_synthesis(prompt, citations, structured_analytics, err=str(e))
        else:
            response_text = self._fallback_grounded_synthesis(prompt, citations, structured_analytics)

        return AskGeoVisionResponse(
            response_text=response_text,
            rag_citations=citations,
            structured_analytics=structured_analytics if structured_analytics else None,
            map_actions=map_actions if map_actions else None,
            executed_tools=executed_tools,
            grounding_status=grounding_status
        )

    def _fallback_grounded_synthesis(
        self,
        prompt: str,
        citations: List[RAGChunkCitation],
        analytics: Dict[str, Any],
        err: Optional[str] = None
    ) -> str:
        """Deterministic, grounded synthesis when running without active external LLM key."""
        sections = []
        sections.append(f"### Geospatial Decision Analysis: {prompt}\n")

        if analytics:
            sections.append("#### Verified Project Analytics:")
            if "lulc_summary" in analytics:
                sections.append("- **Land Cover Distribution**:")
                for item in analytics["lulc_summary"]:
                    sections.append(f"  • **{item.get('class_name')}**: {item.get('area_hectares')} ha ({item.get('percentage')}%)")
            if "buffer_operation" in analytics:
                buf = analytics["buffer_operation"]
                sections.append(f"- **Buffer Analysis ({buf['distance_meters']}m)**: Original Area = {buf['original_area_ha']} ha $\\to$ Buffered Envelope = {buf['buffered_area_ha']} ha.")
            sections.append("")

        if citations:
            sections.append("#### Grounded Knowledge & Academic Evidence:")
            for idx, c in enumerate(citations):
                sections.append(f"> **[{idx+1}] {c.document_name}** (Relevance: {c.similarity_score}):")
                sections.append(f"> \"{c.snippet}\"\n")
        else:
            sections.append("*(No specific literature chunks exceeded the retrieval similarity threshold for this query.)*\n")

        sections.append("#### Strategic Recommendations:")
        sections.append(
            "1. Validate spatial boundaries against high-resolution multispectral imagery.\n"
            "2. Ensure sensor radiometric calibration and atmospheric correction are applied prior to multi-temporal comparison.\n"
            "3. Monitor high-transition zones (e.g. Vegetation $\\to$ Built-up) for urban planning compliance."
        )

        return "\n".join(sections)

ask_geovision_service = AskGeoVisionService()
