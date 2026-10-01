# Geographic Information Systems (GIS) & Remote Sensing — Technical Documentation

## 1. Overview
GeoVision AI provides an integrated GIS and Remote Sensing engine capable of multispectral band analysis, spatial coordinate transformations, geodesic polygon area/perimeter measurements, ellipsoidal buffer zones, and Land Use Land Cover (LULC) classification.

---

## 2. Remote Sensing & Multispectral Band Arithmetic

### 2.1 Spectral Indices
Satellite optical sensors capture discrete spectral channels whose mathematical combinations reveal physical and biochemical surface characteristics:

1. **Normalized Difference Vegetation Index (NDVI)**:
   $$\text{NDVI} = \frac{\rho_{\text{NIR}} - \rho_{\text{Red}}}{\rho_{\text{NIR}} + \rho_{\text{Red}}}$$
   - **Range**: $[-1.0, +1.0]$
   - **Physical Meaning**: Chlorophyll absorption in the Red channel ($0.66\mu m$) contrasted against mesophyll cell scattering in the NIR channel ($0.86\mu m$).
   - **Typical Thresholds**:
     - $< 0.0$: Water bodies, clouds, snow
     - $0.0 - 0.2$: Bare soil, rock, urban concrete
     - $0.2 - 0.5$: Grasslands, sparse shrubs, maturing crops
     - $> 0.5$: Dense healthy forest canopy

2. **Normalized Difference Water Index (NDWI)**:
   $$\text{NDWI} = \frac{\rho_{\text{Green}} - \rho_{\text{NIR}}}{\rho_{\text{Green}} + \rho_{\text{NIR}}}$$
   - Highlights liquid water bodies and open water features while suppressing vegetation and soil reflectance.

3. **Normalized Difference Built-up Index (NDBI)**:
   $$\text{NDBI} = \frac{\rho_{\text{SWIR}} - \rho_{\text{NIR}}}{\rho_{\text{SWIR}} + \rho_{\text{NIR}}}$$
   - Impervious urban materials reflect strongly in the Shortwave Infrared (SWIR, $1.6\mu m$) relative to NIR.

4. **False Color Composite (FCC)**:
   - **Standard FCC**: Band assignments $\text{Red} \leftarrow \text{NIR}$, $\text{Green} \leftarrow \text{Red}$, $\text{Blue} \leftarrow \text{Green}$.
   - Healthy vegetation appears bright red/magenta, urban areas appear cyan/gray, and clear water appears dark blue/black.

---

## 3. Spatial Geometry & Geodesic Calculations

### 3.1 Geodesic Area & Perimeter (WGS84 / EPSG:4326)
Planar Cartesian formulas distort distances and areas over large geographical extents. GeoVision computes polygon metrics using the **WGS84 Reference Ellipsoid** ($a = 6,378,137.0\text{ m}$, $f = 1/298.257223563$) via `pyproj.Geod`:
$$\text{Area} = \oint_{C} x dy - y dx \quad (\text{on ellipsoidal surface})$$
Outputs are provided in square meters ($m^2$), hectares ($ha = 10,000\text{ m}^2$), and square kilometers ($km^2 = 100\text{ ha}$).

### 3.2 Projected Geodesic Buffering
To generate an accurate spatial buffer around a vector polygon or river feature:
1. Centroid $[lon_c, lat_c]$ is computed to identify the optimal UTM zone:
   $$\text{UTM Zone} = \left\lfloor \frac{lon_c + 180}{6} \right\rfloor + 1$$
2. GeoJSON coordinates are reprojected from WGS84 ($\text{EPSG:4326}$) to local UTM conformal planar projection ($\text{EPSG:326XX}$).
3. Euclidean buffer of radius $r$ (in meters) is generated using Shapely.
4. Resulting buffered polygon boundary is reprojected back into WGS84 for Leaflet map display.

---

## 4. Land Use & Land Cover (LULC) Classification & Transition Matrix

### 4.1 5 Core LULC Classes
- **Vegetation** (`#10b981`): Forests, woodlands, urban parks.
- **Water** (`#06b6d4`): Rivers, lakes, wetlands, reservoirs.
- **Built-up** (`#f43f5e`): Commercial, residential, industrial, transport networks.
- **Agriculture** (`#f59e0b`): Cultivated croplands, seasonal farms, orchards.
- **Bare Land** (`#a16207`): Barren soil, sand, exposed rock, fallow terrain.

### 4.2 Multi-Temporal Transition Matrix
Between timestamp $T_1$ (Baseline) and $T_2$ (Recent):
$$M = \begin{bmatrix}
M_{11} & M_{12} & \cdots & M_{15} \\
M_{21} & M_{22} & \cdots & M_{25} \\
\vdots & \vdots & \ddots & \vdots \\
M_{51} & M_{52} & \cdots & M_{55}
\end{bmatrix}$$
- **$M_{ij}$**: Area in hectares that was Class $i$ at $T_1$ and converted into Class $j$ at $T_2$.
- **$M_{ii}$ (Diagonal)**: Unchanged persistent area.
- **$\text{Net Change } \Delta A_k$**: $\sum_{i=1}^5 M_{ik} - \sum_{j=1}^5 M_{kj}$.
