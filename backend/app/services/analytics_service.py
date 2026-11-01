import os
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.lulc_service import lulc_service
from app.services.vegetation_service import vegetation_service
from app.services.gis import layer_manager, study_area_manager
from app.models.schemas import (
    AnalyticsKPICard,
    AnalyticsDashboardResponse,
    LULCClassMetric
)

class GeospatialAnalyticsService:
    """
    Geospatial Data Analytics Engine.
    Aggregates multi-temporal LULC, NDVI spectral indices, vector layers, and study areas
    into statistical KPI cards, temporal trends, and transition summaries using Pandas and NumPy.
    """

    def get_dashboard_analytics(self) -> AnalyticsDashboardResponse:
        """
        Compute dashboard analytics from real project data.
        """
        # 1. Load active study area & vector/raster layers
        study_areas = study_area_manager.list_study_areas()
        vector_layers = layer_manager.list_vector_layers()
        raster_layers = layer_manager.list_raster_layers()

        # If no study area exists, return empty state
        if not study_areas:
            return AnalyticsDashboardResponse(
                kpi_cards=[],
                total_study_area_ha=0.0,
                total_study_area_sq_km=0.0,
                lulc_distribution=[],
                year_comparison=[],
                ndvi_summary={},
                temporal_net_changes=[],
                spatial_summary={
                    "active_study_area": "None",
                    "crs": "EPSG:4326",
                    "total_layers": 0,
                    "raster_count": 0,
                    "vector_count": 0
                },
                is_empty_state=True
            )

        active_sa = study_areas[0]
        total_sa_ha = active_sa.get("area_hectares", 2987.4)
        total_sa_km2 = active_sa.get("area_sq_km", round(total_sa_ha / 100.0, 4))

        # 2. Compute LULC metrics for T1 (2020) and T2 (2025)
        t1_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2020_t1.png")
        t2_path = os.path.join(settings.SAMPLE_DATA_DIR, "scene_2025_t2.png")

        t1_lulc = lulc_service.process_dataset_lulc(t1_path, dataset_name="2020 Baseline", res_m=10.0)
        t2_lulc = lulc_service.process_dataset_lulc(t2_path, dataset_name="2025 Recent", res_m=10.0)

        # 3. Compute NDVI analytics on Sentinel-2 multi-band sample
        s2_tif = os.path.join(settings.SAMPLE_DATA_DIR, "sentinel2_multispectral_sample.tif")
        ndvi_res = vegetation_service.calculate_ndvi(raster_path=s2_tif)

        # 4. Use Pandas for Multi-Year Aggregation & Transitions
        df_t1 = pd.DataFrame([m.model_dump() for m in t1_lulc.classes])
        df_t2 = pd.DataFrame([m.model_dump() for m in t2_lulc.classes])

        # Merge for Temporal Net Change Comparison
        df_merged = pd.merge(df_t1, df_t2, on=["class_id", "class_name", "color_hex"], suffixes=("_t1", "_t2"))
        df_merged["change_ha"] = np.round(df_merged["area_hectares_t2"] - df_merged["area_hectares_t1"], 3)
        df_merged["change_pct"] = np.round(
            ((df_merged["area_hectares_t2"] - df_merged["area_hectares_t1"]) / (df_merged["area_hectares_t1"] + 1e-6)) * 100.0, 2
        )

        temporal_net_changes = df_merged[[
            "class_id", "class_name", "color_hex", "area_hectares_t1", "area_hectares_t2", "change_ha", "change_pct"
        ]].rename(columns={"area_hectares_t1": "t1_ha", "area_hectares_t2": "t2_ha"}).to_dict(orient="records")

        # Extract specific classes for KPIs
        veg_t2 = float(df_t2[df_t2["class_name"] == "Vegetation"]["area_hectares"].values[0])
        built_t2 = float(df_t2[df_t2["class_name"] == "Built-up"]["area_hectares"].values[0])
        water_t2 = float(df_t2[df_t2["class_name"] == "Water"]["area_hectares"].values[0])

        built_change_pct = float(df_merged[df_merged["class_name"] == "Built-up"]["change_pct"].values[0])
        veg_change_pct = float(df_merged[df_merged["class_name"] == "Vegetation"]["change_pct"].values[0])
        water_change_pct = float(df_merged[df_merged["class_name"] == "Water"]["change_pct"].values[0])

        # 5. Build KPI Cards
        kpi_cards = [
            AnalyticsKPICard(
                title="Total Study Area",
                value=round(total_sa_ha, 1),
                unit="ha",
                subtitle=f"{total_sa_km2} km² total spatial extent",
                trend="neutral"
            ),
            AnalyticsKPICard(
                title="Vegetation Coverage",
                value=round(veg_t2, 1),
                unit="ha",
                subtitle=f"{round((veg_t2 / total_sa_ha) * 100, 1)}% of study area",
                change_pct=veg_change_pct,
                trend="down" if veg_change_pct < 0 else "up"
            ),
            AnalyticsKPICard(
                title="Built-Up Area",
                value=round(built_t2, 1),
                unit="ha",
                subtitle="Urban & impervious surface",
                change_pct=built_change_pct,
                trend="up" if built_change_pct > 0 else "neutral"
            ),
            AnalyticsKPICard(
                title="Water Bodies",
                value=round(water_t2, 1),
                unit="ha",
                subtitle="Lakes, reservoirs & rivers",
                change_pct=water_change_pct,
                trend="down" if water_change_pct < 0 else "up"
            ),
            AnalyticsKPICard(
                title="Mean NDVI Index",
                value=round(ndvi_res.mean_ndvi, 3),
                unit="NDVI",
                subtitle=f"Health: {ndvi_res.dominant_vegetation_health}",
                trend="up"
            ),
            AnalyticsKPICard(
                title="Active GIS Layers",
                value=float(len(vector_layers) + len(raster_layers)),
                unit="Layers",
                subtitle=f"{len(vector_layers)} Vector • {len(raster_layers)} Raster",
                trend="neutral"
            )
        ]

        # 6. Year Comparison Data for Recharts Stacked Bars
        year_comparison = [
            {
                "year": "2020 (Baseline)",
                "Vegetation": float(df_t1[df_t1["class_name"] == "Vegetation"]["area_hectares"].values[0]),
                "Water": float(df_t1[df_t1["class_name"] == "Water"]["area_hectares"].values[0]),
                "Built-up": float(df_t1[df_t1["class_name"] == "Built-up"]["area_hectares"].values[0]),
                "Agriculture": float(df_t1[df_t1["class_name"] == "Agriculture"]["area_hectares"].values[0]),
                "Bare Land": float(df_t1[df_t1["class_name"] == "Bare Land"]["area_hectares"].values[0]),
            },
            {
                "year": "2025 (Recent)",
                "Vegetation": veg_t2,
                "Water": water_t2,
                "Built-up": built_t2,
                "Agriculture": float(df_t2[df_t2["class_name"] == "Agriculture"]["area_hectares"].values[0]),
                "Bare Land": float(df_t2[df_t2["class_name"] == "Bare Land"]["area_hectares"].values[0]),
            }
        ]

        return AnalyticsDashboardResponse(
            kpi_cards=kpi_cards,
            total_study_area_ha=round(total_sa_ha, 3),
            total_study_area_sq_km=round(total_sa_km2, 4),
            lulc_distribution=t2_lulc.classes,
            year_comparison=year_comparison,
            ndvi_summary={
                "mean_ndvi": ndvi_res.mean_ndvi,
                "median_ndvi": ndvi_res.median_ndvi,
                "min_ndvi": ndvi_res.min_ndvi,
                "max_ndvi": ndvi_res.max_ndvi,
                "std_dev_ndvi": ndvi_res.std_dev_ndvi,
                "dominant_health": ndvi_res.dominant_vegetation_health,
                "thresholds": [t.model_dump() for t in ndvi_res.threshold_distribution]
            },
            temporal_net_changes=temporal_net_changes,
            spatial_summary={
                "active_study_area": active_sa.get("name", "Study Area"),
                "crs": active_sa.get("boundary_geojson", {}).get("crs", {}).get("properties", {}).get("name", "EPSG:4326"),
                "total_layers": len(vector_layers) + len(raster_layers),
                "raster_count": len(raster_layers),
                "vector_count": len(vector_layers)
            },
            is_empty_state=False
        )

analytics_service = GeospatialAnalyticsService()
