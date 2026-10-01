# Remote Sensing Fundamentals & Spectral Analysis

## 1. Principles of Optical Remote Sensing
Optical satellite sensors capture electromagnetic radiation reflected from the Earth's surface across discrete spectral bands:
- **Blue Band (0.45 - 0.51 µm)**: Used for atmospheric and deep water body mapping.
- **Green Band (0.53 - 0.59 µm)**: Peaks in vegetation reflectance; used for water discrimination.
- **Red Band (0.64 - 0.67 µm)**: High absorption by chlorophyll-a in healthy vegetation.
- **Near-Infrared (NIR) Band (0.85 - 0.88 µm)**: High reflectance due to mesophyll cell structure in healthy leaf canopies.
- **Shortwave Infrared (SWIR-1: 1.57 - 1.65 µm, SWIR-2: 2.11 - 2.29 µm)**: Sensitive to leaf moisture content, soil mineralogy, and impervious urban concrete.

## 2. Standard Normalized Difference Spectral Indices

### Normalized Difference Vegetation Index (NDVI)
The Normalized Difference Vegetation Index assesses vegetation vigor and biomass density:
$$NDVI = \frac{\rho_{NIR} - \rho_{Red}}{\rho_{NIR} + \rho_{Red}}$$
Values range from -1.0 to +1.0:
- **-1.0 to 0.0**: Water bodies, clouds, snow, and bare rock surfaces.
- **0.0 to 0.2**: Bare soil, sand, and impervious built-up infrastructure.
- **0.2 to 0.5**: Sparse vegetation, grasslands, shrubs, and maturing crops.
- **0.5 to 1.0**: Dense, healthy forest canopies and flourishing agricultural fields.

### Normalized Difference Water Index (NDWI)
Formulated by Gao (1996) and McFeeters (1996) to delineate open water features and liquid canopy moisture:
$$NDWI = \frac{\rho_{Green} - \rho_{NIR}}{\rho_{Green} + \rho_{NIR}}$$
Positive values (> 0.0) indicate water bodies, rivers, lakes, and saturated marshlands.

### Normalized Difference Built-up Index (NDBI)
Formulated by Zha et al. (2003) to automatically segment built-up areas and impervious infrastructure:
$$NDBI = \frac{\rho_{SWIR} - \rho_{NIR}}{\rho_{SWIR} + \rho_{NIR}}$$
Positive NDBI indicates high density of concrete, asphalt, buildings, and urban structures.

## 3. Sensor Spatial and Spectral Resolutions
- **Sentinel-2 MSI**: 10m (B2, B3, B4, B8), 20m (B5, B6, B7, B8A, B11, B12), 60m (B1, B9, B10). Temporal revisit: 5 days.
- **Landsat-8/9 OLI/TIRS**: 30m multispectral, 15m panchromatic, 100m thermal. Temporal revisit: 16 days (8 days combined).
