import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.gis.geometry import validate_geojson_geometry
from app.services.gis.geodesic import geodesic_engine

class StudyAreaManager:
    """
    Manages Study Areas (AOIs), computing true geodesic area, perimeter,
    and linking vector layers and satellite raster datasets.
    """

    def __init__(self):
        self.storage_file = os.path.join(settings.BASE_DIR, "data", "gis_layers", "study_areas.json")
        os.makedirs(os.path.dirname(self.storage_file), exist_ok=True)
        self._init_defaults()

    def _init_defaults(self):
        if not os.path.exists(self.storage_file):
            default_study_areas = []
            study_area_path = os.path.join(settings.SAMPLE_DATA_DIR, "study_area_boundary.geojson")
            if os.path.exists(study_area_path):
                with open(study_area_path, "r", encoding="utf-8") as f:
                    geojson_data = json.load(f)
                metrics = geodesic_engine.calculate_polygon_metrics(geojson_data)
                default_study_areas.append({
                    "id": "study_area_default",
                    "name": "Sentinel-2 Hyderabad Study Area",
                    "description": "Standard 10m Sentinel-2 multi-spectral verification scene AOI.",
                    "dataset_id": "sentinel2_sample_scene",
                    "boundary_geojson": geojson_data,
                    "area_hectares": metrics["area_hectares"],
                    "area_sq_km": metrics["area_sq_km"],
                    "perimeter_meters": metrics["perimeter_meters"],
                    "centroid": metrics["centroid"],
                    "bbox": metrics["bounding_box"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump(default_study_areas, f, indent=2)

    def _load_study_areas(self) -> List[Dict[str, Any]]:
        try:
            with open(self.storage_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_study_areas(self, items: List[Dict[str, Any]]):
        with open(self.storage_file, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2)

    def create_study_area(
        self,
        name: str,
        boundary_geojson: Dict[str, Any],
        description: Optional[str] = None,
        dataset_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create and persist a new study area project.
        """
        is_valid, issues, repaired_geojson, details = validate_geojson_geometry(boundary_geojson)
        final_geojson = repaired_geojson if (not is_valid and repaired_geojson) else boundary_geojson

        metrics = geodesic_engine.calculate_polygon_metrics(final_geojson)
        study_area_id = f"study_area_{uuid.uuid4().hex[:10]}"

        study_area_obj = {
            "id": study_area_id,
            "name": name,
            "description": description or f"Study area: {name}",
            "dataset_id": dataset_id,
            "boundary_geojson": final_geojson,
            "area_hectares": metrics["area_hectares"],
            "area_sq_km": metrics["area_sq_km"],
            "perimeter_meters": metrics["perimeter_meters"],
            "centroid": metrics["centroid"],
            "bbox": metrics["bounding_box"],
            "is_valid": is_valid,
            "validation_issues": issues,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        items = self._load_study_areas()
        items.append(study_area_obj)
        self._save_study_areas(items)
        return study_area_obj

    def list_study_areas(self) -> List[Dict[str, Any]]:
        return self._load_study_areas()

    def get_study_area(self, study_area_id: str) -> Optional[Dict[str, Any]]:
        for sa in self._load_study_areas():
            if sa.get("id") == study_area_id:
                return sa
        return None

    def delete_study_area(self, study_area_id: str) -> bool:
        items = self._load_study_areas()
        filtered = [s for s in items if s.get("id") != study_area_id]
        if len(filtered) < len(items):
            self._save_study_areas(filtered)
            return True
        return False

study_area_manager = StudyAreaManager()
