import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.gis.geometry import validate_geojson_geometry, extract_features_and_geometries
from app.services.gis.geodesic import geodesic_engine
from app.services.gis.raster_gis import raster_gis_engine

class LayerManager:
    """
    Manages Vector and Raster GIS layers, layer styling, visibility, z-index ordering,
    and GeoJSON exports with persistent storage and optional PostGIS synchronization.
    """

    def __init__(self):
        self.storage_dir = os.path.join(settings.BASE_DIR, "data", "gis_layers")
        os.makedirs(self.storage_dir, exist_ok=True)
        self.vector_layers_file = os.path.join(self.storage_dir, "vector_layers.json")
        self.raster_layers_file = os.path.join(self.storage_dir, "raster_layers.json")
        self._init_defaults()

    def _init_defaults(self):
        if not os.path.exists(self.vector_layers_file):
            # Create default sample vector layer from study area
            default_layers = []
            study_area_path = os.path.join(settings.SAMPLE_DATA_DIR, "study_area_boundary.geojson")
            if os.path.exists(study_area_path):
                with open(study_area_path, "r", encoding="utf-8") as f:
                    geojson_data = json.load(f)
                metrics = geodesic_engine.calculate_polygon_metrics(geojson_data)
                default_layers.append({
                    "id": "layer_study_boundary",
                    "name": "Sentinel-2 Study Area Boundary",
                    "study_area_id": "study_area_default",
                    "layer_type": "polygon",
                    "feature_count": 1,
                    "crs": "EPSG:4326",
                    "style_config": {
                        "fill_color": "#38bdf8",
                        "stroke_color": "#0284c7",
                        "stroke_width": 2,
                        "opacity": 1.0,
                        "fill_opacity": 0.25
                    },
                    "visible": True,
                    "z_index": 1,
                    "geojson_data": geojson_data,
                    "area_hectares": metrics["area_hectares"],
                    "perimeter_meters": metrics["perimeter_meters"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            with open(self.vector_layers_file, "w", encoding="utf-8") as f:
                json.dump(default_layers, f, indent=2)

        if not os.path.exists(self.raster_layers_file):
            default_raster_layers = [
                {
                    "id": "raster_sentinel2_rgb",
                    "name": "Sentinel-2 True Color (10m)",
                    "study_area_id": "study_area_default",
                    "file_path": os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif"),
                    "crs": "EPSG:32643",
                    "spatial_resolution_m": 10.0,
                    "width": 512,
                    "height": 512,
                    "band_count": 5,
                    "bounds_wgs84": [78.4350, 17.4120, 78.4862, 17.4632],
                    "colormap": "rgb",
                    "opacity": 1.0,
                    "visible": True,
                    "z_index": 0,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            ]
            with open(self.raster_layers_file, "w", encoding="utf-8") as f:
                json.dump(default_raster_layers, f, indent=2)

    def _load_vector_layers(self) -> List[Dict[str, Any]]:
        try:
            with open(self.vector_layers_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_vector_layers(self, layers: List[Dict[str, Any]]):
        with open(self.vector_layers_file, "w", encoding="utf-8") as f:
            json.dump(layers, f, indent=2)

    def _load_raster_layers(self) -> List[Dict[str, Any]]:
        try:
            with open(self.raster_layers_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_raster_layers(self, layers: List[Dict[str, Any]]):
        with open(self.raster_layers_file, "w", encoding="utf-8") as f:
            json.dump(layers, f, indent=2)

    # ----------------------------------------------------
    # Vector Layer CRUD & Management
    # ----------------------------------------------------
    def create_vector_layer(
        self,
        name: str,
        geojson_data: Dict[str, Any],
        study_area_id: Optional[str] = None,
        style_config: Optional[Dict[str, Any]] = None,
        layer_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate, create, and persist a new vector layer.
        """
        is_valid, issues, repaired_geojson, details = validate_geojson_geometry(geojson_data)
        final_geojson = repaired_geojson if (not is_valid and repaired_geojson) else geojson_data
        
        feature_tuples = extract_features_and_geometries(final_geojson)
        feature_count = len(feature_tuples)
        
        # Determine layer type if not provided
        if not layer_type:
            geom_types = details.get("geometry_types", ["Polygon"])
            layer_type = geom_types[0].lower() if geom_types else "polygon"

        # Calculate metrics
        metrics = {}
        try:
            metrics = geodesic_engine.calculate_polygon_metrics(final_geojson)
        except Exception:
            pass

        default_style = {
            "fill_color": "#10b981" if layer_type == "polygon" else "#0284c7",
            "stroke_color": "#047857" if layer_type == "polygon" else "#0369a1",
            "stroke_width": 2,
            "opacity": 1.0,
            "fill_opacity": 0.3 if layer_type == "polygon" else 0.8
        }
        if style_config:
            default_style.update(style_config)

        layer_id = f"vector_{uuid.uuid4().hex[:10]}"
        layers = self._load_vector_layers()
        max_z = max([l.get("z_index", 0) for l in layers], default=0)

        layer_obj = {
            "id": layer_id,
            "name": name,
            "study_area_id": study_area_id,
            "layer_type": layer_type,
            "feature_count": feature_count,
            "crs": "EPSG:4326",
            "style_config": default_style,
            "visible": True,
            "z_index": max_z + 1,
            "geojson_data": final_geojson,
            "area_hectares": metrics.get("area_hectares"),
            "perimeter_meters": metrics.get("perimeter_meters"),
            "centroid": metrics.get("centroid"),
            "bounding_box": metrics.get("bounding_box"),
            "is_valid": is_valid,
            "validation_issues": issues,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        layers.append(layer_obj)
        self._save_vector_layers(layers)
        return layer_obj

    def list_vector_layers(self, study_area_id: Optional[str] = None) -> List[Dict[str, Any]]:
        layers = self._load_vector_layers()
        if study_area_id:
            return [l for l in layers if l.get("study_area_id") == study_area_id or not l.get("study_area_id")]
        return sorted(layers, key=lambda l: l.get("z_index", 0))

    def get_vector_layer(self, layer_id: str) -> Optional[Dict[str, Any]]:
        layers = self._load_vector_layers()
        for l in layers:
            if l.get("id") == layer_id:
                return l
        return None

    def update_vector_layer(self, layer_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        layers = self._load_vector_layers()
        for idx, l in enumerate(layers):
            if l.get("id") == layer_id:
                if "name" in updates:
                    layers[idx]["name"] = updates["name"]
                if "visible" in updates:
                    layers[idx]["visible"] = updates["visible"]
                if "z_index" in updates:
                    layers[idx]["z_index"] = updates["z_index"]
                if "style_config" in updates:
                    layers[idx]["style_config"].update(updates["style_config"])
                self._save_vector_layers(layers)
                return layers[idx]
        return None

    def delete_vector_layer(self, layer_id: str) -> bool:
        layers = self._load_vector_layers()
        filtered = [l for l in layers if l.get("id") != layer_id]
        if len(filtered) < len(layers):
            self._save_vector_layers(filtered)
            return True
        return False

    # ----------------------------------------------------
    # Raster Layer CRUD & Management
    # ----------------------------------------------------
    def create_raster_layer(
        self,
        name: str,
        file_path: str,
        study_area_id: Optional[str] = None,
        colormap: str = "grayscale",
        opacity: float = 1.0
    ) -> Dict[str, Any]:
        """
        Register a new raster layer.
        """
        meta = raster_gis_engine.extract_raster_metadata(file_path)
        layer_id = f"raster_{uuid.uuid4().hex[:10]}"
        layers = self._load_raster_layers()
        max_z = max([l.get("z_index", 0) for l in layers], default=0)

        layer_obj = {
            "id": layer_id,
            "name": name,
            "study_area_id": study_area_id,
            "file_path": file_path,
            "crs": meta.get("crs", "EPSG:4326"),
            "spatial_resolution_m": meta.get("spatial_resolution", [10.0])[0],
            "width": meta.get("width"),
            "height": meta.get("height"),
            "band_count": meta.get("band_count", 1),
            "bounds_wgs84": meta.get("bounds_wgs84"),
            "geographic_extent": meta.get("geographic_extent"),
            "colormap": colormap,
            "opacity": opacity,
            "visible": True,
            "z_index": max_z + 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        layers.append(layer_obj)
        self._save_raster_layers(layers)
        return layer_obj

    def list_raster_layers(self, study_area_id: Optional[str] = None) -> List[Dict[str, Any]]:
        layers = self._load_raster_layers()
        if study_area_id:
            return [l for l in layers if l.get("study_area_id") == study_area_id or not l.get("study_area_id")]
        return sorted(layers, key=lambda l: l.get("z_index", 0))

    def update_raster_layer(self, layer_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        layers = self._load_raster_layers()
        for idx, l in enumerate(layers):
            if l.get("id") == layer_id:
                if "name" in updates:
                    layers[idx]["name"] = updates["name"]
                if "visible" in updates:
                    layers[idx]["visible"] = updates["visible"]
                if "opacity" in updates:
                    layers[idx]["opacity"] = updates["opacity"]
                if "z_index" in updates:
                    layers[idx]["z_index"] = updates["z_index"]
                if "colormap" in updates:
                    layers[idx]["colormap"] = updates["colormap"]
                self._save_raster_layers(layers)
                return layers[idx]
        return None

    def delete_raster_layer(self, layer_id: str) -> bool:
        layers = self._load_raster_layers()
        filtered = [l for l in layers if l.get("id") != layer_id]
        if len(filtered) < len(layers):
            self._save_raster_layers(filtered)
            return True
        return False

    # ----------------------------------------------------
    # Reorder Layers (Z-Index Management)
    # ----------------------------------------------------
    def reorder_layers(self, ordered_layer_ids: List[str]) -> Dict[str, Any]:
        """
        Update z-index of layers in specified order.
        """
        v_layers = self._load_vector_layers()
        r_layers = self._load_raster_layers()

        for new_z, l_id in enumerate(ordered_layer_ids):
            for v in v_layers:
                if v["id"] == l_id:
                    v["z_index"] = new_z
            for r in r_layers:
                if r["id"] == l_id:
                    r["z_index"] = new_z

        self._save_vector_layers(v_layers)
        self._save_raster_layers(r_layers)

        return {
            "success": True,
            "ordered_layer_ids": ordered_layer_ids
        }

    # ----------------------------------------------------
    # Export Layer as Clean GeoJSON
    # ----------------------------------------------------
    def export_layer_geojson(self, layer_id: str) -> Dict[str, Any]:
        layer = self.get_vector_layer(layer_id)
        if not layer:
            raise FileNotFoundError(f"Vector layer '{layer_id}' not found.")
        return layer.get("geojson_data", {})

layer_manager = LayerManager()
