# GIS, Spatial Analysis & Urban Land Cover Standards

## 1. Spatial Coordinate Systems & Geodesic Calculations
- **Geographic Coordinate Systems (EPSG:4326 / WGS84)**: Coordinates expressed in spherical angles (latitude/longitude in degrees). Area calculations on EPSG:4326 must use ellipsoidal geodesics ($a=6378137.0\text{ m}, 1/f=298.257223563$).
- **Projected Coordinate Systems (UTM Zones)**: Conformal cylindrical projections minimizing local distortion. Distance in meters; used for buffer generation and spatial clipping.

## 2. Land Use Land Cover (LULC) Classification Schemes
The GeoVision LULC engine classifies scenes into 5 primary classes:
1. **Vegetation**: Forests, dense woodlands, natural reserves, parks (Color: `#10b981`).
2. **Water Bodies**: Rivers, lakes, reservoirs, coastal waters, wetlands (Color: `#06b6d4`).
3. **Built-up / Urban**: Residential, commercial, industrial complexes, transport networks, paved impervious surfaces (Color: `#f43f5e`).
4. **Agriculture**: Cultivated croplands, orchards, pastureland, seasonal farms (Color: `#f59e0b`).
5. **Bare Land**: Barren soil, sand dunes, exposed rock, fallow uncultivated terrain (Color: `#a16207`).

## 3. Multi-Temporal Transition Matrix Formulation
For multi-temporal change detection between time $T_1$ and $T_2$, the transition matrix $M$ is defined as an $N \times N$ matrix where entry $M_{ij}$ denotes the area transitioning from class $i$ at $T_1$ to class $j$ at $T_2$:
- **Diagonal Elements ($M_{ii}$)**: Unchanged persistence area for class $i$.
- **Off-Diagonal Row Elements ($\sum_{j \ne i} M_{ij}$)**: Total gross loss of class $i$.
- **Off-Diagonal Column Elements ($\sum_{i \ne j} M_{ij}$)**: Total gross gain of class $j$.
- **Net Change**: $\Delta A_i = \text{Gain}_i - \text{Loss}_i = \sum_{k=1}^N M_{ki} - \sum_{k=1}^N M_{ik}$.

## 4. Environmental Buffer Zones & Urban Encroachment
- **Riparian Buffer Standards**: Minimum 50m to 100m vegetated buffer around river channels to filter agricultural runoff and prevent sediment erosion.
- **Urban Sprawl Monitoring**: Detecting built-up expansion into prime agricultural zones ($M_{3,2}$) or protected vegetative reserves ($M_{0,2}$).
