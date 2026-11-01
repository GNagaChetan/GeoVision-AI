from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseSatelliteProvider(ABC):
    """
    Abstract Base Class for satellite data providers (e.g. Local Archive, Copernicus Hub, STAC, Planetary Computer).
    Allows plug-and-play expansion to live external satellite constellations.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the data provider service."""
        pass

    @abstractmethod
    def search_scenes(
        self,
        bbox: List[float],
        start_date: str,
        end_date: str,
        max_cloud_cover: float = 20.0
    ) -> List[Dict[str, Any]]:
        """Search catalog for satellite scenes matching bounding box and date range."""
        pass

    @abstractmethod
    def fetch_scene_metadata(self, scene_id: str) -> Dict[str, Any]:
        """Fetch detailed telemetry and band assets for a scene."""
        pass

    @abstractmethod
    def download_or_stream_band(self, scene_id: str, band_name: str) -> str:
        """Download or retrieve local cache URI for a requested band asset."""
        pass
