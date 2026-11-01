# Remote Sensing Fundamentals & Spectral Analysis

## 1. What is Remote Sensing?
Remote sensing is the science and art of acquiring information about the Earth's surface and atmosphere without making direct physical contact. This is achieved by sensing and recording reflected or emitted electromagnetic radiation via airborne or spaceborne sensors:
- **Passive Remote Sensing**: Sensors (such as Sentinel-2 MSI and Landsat-8/9 OLI) rely on external illumination, predominantly reflected solar radiation in optical and infrared bands, or emitted thermal radiation.
- **Active Remote Sensing**: Sensors (such as Synthetic Aperture Radar / SAR and LiDAR) emit their own electromagnetic pulses and measure the backscattered signal and time delay.

## 2. Electromagnetic Spectrum & Optical Sensor Bands
Optical satellite sensors capture electromagnetic radiation reflected from the Earth's surface across discrete spectral bands:
- **Blue Band (0.45 - 0.51 µm)**: Used for atmospheric aerosol studies, coastal water mapping, and soil-vegetation differentiation.
- **Green Band (0.53 - 0.59 µm)**: Corresponds to the peak of green vegetation reflectance; used for water discrimination and chlorophyll assessment.
- **Red Band (0.64 - 0.67 µm)**: Characterized by strong radiant absorption by chlorophyll-a and chlorophyll-b in healthy active photosynthetic tissue.
- **Near-Infrared (NIR) Band (0.85 - 0.88 µm)**: Exhibits exceptionally high reflectance (40-60%) due to internal scattering across the spongy mesophyll cell structure of healthy green leaf canopies.
- **Shortwave Infrared (SWIR-1: 1.57 - 1.65 µm, SWIR-2: 2.11 - 2.29 µm)**: Highly sensitive to leaf moisture content, soil mineralogy, clay composition, and urban impervious concrete structures.

## 3. What does NDVI Represent?
The **Normalized Difference Vegetation Index (NDVI)** is a dimensionless radiometric index that quantitatively measures chlorophyll concentration, photosynthetic capacity, and canopy biomass density:
$$NDVI = \frac{\rho_{NIR} - \rho_{Red}}{\rho_{NIR} + \rho_{Red}}$$

### Biophysical Mechanics
Healthy green vegetation absorbs red light for photosynthesis while strongly scattering near-infrared light from mesophyll cell walls. As a plant experiences water stress, chlorosis, or senesces, red absorption decreases and NIR reflectance drops sharply, lowering the NDVI value.

### Standard NDVI Classification Thresholds:
- **-1.0 to 0.0 (Water Bodies & Clouds)**: Deep open water, rivers, lakes, cloud cover, and snow/ice features (water absorbs NIR completely).
- **0.0 to 0.2 (Bare Soil & Built-Up)**: Barren earth, sandy desert, exposed rock, paved asphalt roads, and urban concrete structures.
- **0.2 to 0.5 (Moderate Vegetation)**: Sparse shrublands, seasonal grasslands, semi-arid brush, and maturing agricultural crops.
- **0.5 to 1.0 (Dense Healthy Forest)**: Flourishing closed canopy forests, dense tropical woodlands, and peak-growth irrigated croplands.

## 4. Other Standard Spectral Indices
- **Normalized Difference Water Index (NDWI)**: Delineates water bodies using Green and NIR bands: $NDWI = (\rho_{Green} - \rho_{NIR}) / (\rho_{Green} + \rho_{NIR})$.
- **Normalized Difference Built-up Index (NDBI)**: Maps urban surfaces using SWIR and NIR bands: $NDBI = (\rho_{SWIR} - \rho_{NIR}) / (\rho_{SWIR} + \rho_{NIR})$.

## 5. Sensor Resolutions & Satellite Specifications
- **Sentinel-2 MultiSpectral Instrument (MSI)**: 10m spatial resolution in VNIR bands (B2, B3, B4, B8), 20m in red edge and SWIR (B5, B6, B7, B8A, B11, B12), and 60m in atmospheric bands. Constellation temporal revisit is 5 days.
- **Landsat-8/9 OLI/TIRS**: 30m multispectral resolution, 15m panchromatic band, and 100m thermal infrared. Constellation revisit is 8 days.
