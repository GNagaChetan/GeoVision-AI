import os
from fastapi import APIRouter, HTTPException, Query, Path, status, Response
from typing import Optional, List, Dict, Any
from app.services.report_service import report_service

router = APIRouter()

@router.post("/generate")
async def generate_report(
    project_title: str = Query("GeoVision AI Executive Geospatial Analytical Report"),
    author: str = Query("GeoVision AI Automated System"),
    resolution_m: float = Query(10.0)
):
    """Generate a comprehensive 14-section academic report from active project data and index it into RAG."""
    try:
        report = report_service.generate_full_report(
            project_title=project_title,
            author=author,
            resolution_m=resolution_m
        )
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation error: {str(e)}"
        )

@router.get("/history")
async def list_report_history():
    """List historical reports generated for this project."""
    return {"reports": report_service.list_reports()}

@router.get("/{report_id}")
async def get_report(report_id: str = Path(...)):
    """Retrieve full details for a previously generated report."""
    safe_id = os.path.basename(report_id)
    report = report_service.get_report_by_id(safe_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{safe_id}' not found."
        )
    return report

@router.get("/{report_id}/markdown")
async def export_report_markdown(report_id: str = Path(...)):
    """Export report formatted in academic Markdown."""
    safe_id = os.path.basename(report_id)
    report = report_service.get_report_by_id(safe_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{safe_id}' not found."
        )
    
    sa = report["study_area"]
    veg = report["vegetation_analytics"]
    cd = report["change_detection"]
    
    md = f"""# {report['project_title']}
**Report ID**: {report['report_id']}  
**Generated**: {report['generated_at']}  
**Author**: {report['author']}  

---

## 1. Executive Summary & Study Area
- **Study Area**: {sa['name']}
- **Total Geographic Extent**: {sa['total_area_ha']} ha ({sa['total_area_km2']} km²)
- **Spatial Reference**: {sa['crs']}
- **Ground Sampling Distance (GSD)**: {sa['ground_sampling_distance_m']} m

## 2. Satellite & Sensor Provenance
- **Platform**: {report['satellite_sensor']['sensor_platform']}
- **Processing Level**: {report['satellite_sensor']['level']}
- **Bands**: {', '.join(report['satellite_sensor']['bands_processed'])}

## 3. Land Use / Land Cover (LULC) Classification
- **Dominant Class**: {report['lulc_classification']['dominant_class']}
- **Method**: {report['lulc_classification']['method']}

| Class | 2020 Area (ha) | 2020 (%) | 2025 Area (ha) | 2025 (%) |
|---|---|---|---|---|
"""
    t1_map = {c['class_name']: c for c in report['lulc_classification']['classes_t1_2020']}
    t2_map = {c['class_name']: c for c in report['lulc_classification']['classes_t2_2025']}
    for name in t1_map:
        c1 = t1_map[name]
        c2 = t2_map.get(name, {})
        md += f"| {name} | {c1.get('area_hectares', 0)} | {c1.get('percentage', 0)}% | {c2.get('area_hectares', 0)} | {c2.get('percentage', 0)}% |\n"

    md += f"""
## 4. Multispectral Vegetation Analytics (NDVI)
- **Formula**: ${veg['formula']}$
- **Mean NDVI**: {veg['mean_ndvi']} (Min: {veg['min_ndvi']}, Max: {veg['max_ndvi']}, Median: {veg['median_ndvi']}, StdDev: {veg['std_dev']})
- **Dominant Canopy Health**: {veg['dominant_vegetation_health']}

## 5. Multi-Temporal Change Detection Dynamics
- **Unchanged Stable Area**: {cd['unchanged_area_ha']} ha ({cd['unchanged_percentage']}%)
- **Total Converted Area**: {cd['total_changed_area_ha']} ha ({cd['total_changed_percentage']}%)
- **Dominant Transition**: {cd['most_converted_transition'].get('from_class')} -> {cd['most_converted_transition'].get('to_class')} ({cd['most_converted_transition'].get('area_ha')} ha)

## 6. Academic Traceability & References
"""
    for src in report.get("rag_sources", []):
        md += f"- **{src['document_name']}** (Sec {src['page_number']}): \"{src['snippet']}\"\n"

    md += f"""
## 7. Limitations & Uncertainty Notes
"""
    for lim in report.get("limitations_and_provenance", []):
        md += f"- {lim}\n"

    return Response(
        content=md,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={safe_id}.md"}
    )
