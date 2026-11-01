# GIS, Spatial Analysis & Urban Land Cover Standards

## 1. What is the Difference Between Raster and Vector Data?
In Geographic Information Systems (GIS), spatial reality is modeled using two foundational data architectures:

### Raster Data Model
- **Definition**: A continuous matrix (grid) of equal-sized rectangular cells (pixels) organized into rows and columns, where each cell stores a numeric value representing a measured attribute.
- **Characteristics**: Georeferenced by an origin coordinate, ground sampling distance (pixel resolution), and coordinate reference system (CRS).
- **Primary Uses**: Satellite imagery (GeoTIFF), digital elevation models (DEMs), land cover classification grids, and temperature surfaces.
- **Strengths**: Continuous field representation, rapid map algebra, raster overlay, and matrix image processing.

### Vector Data Model
- **Definition**: A discrete feature model that represents real-world entities using explicit geometric coordinate pairs $(x, y)$ or $(x, y, z)$ associated with structured tabular attribute records.
- **Primitive Geometries**:
  - **Points**: Discrete zero-dimensional coordinate locations (e.g., weather stations, GPS trees, soil sample points).
  - **LineStrings (Lines)**: One-dimensional linear sequences of connected vertices (e.g., road centerlines, river streams, power transmission lines).
  - **Polygons**: Two-dimensional closed linear boundary loops enclosing a discrete area (e.g., study area boundaries, municipal administrative parcels, water reservoirs).
- **Primary Uses**: Parcel cadastres, road networks, zoning boundaries, and infrastructure management (GeoJSON, ESRI Shapefile, PostGIS tables).
- **Strengths**: High topological precision, compact discrete storage, exact perimeter and geodesic area calculations, and attribute relational queries.

## 2. What is Land Use / Land Cover (LULC)?
- **Land Cover**: Represents the observed physical and biological material covering the Earth's surface (e.g., forest canopy, surface water, bare rock, grassland).
- **Land Use**: Describes the socio-economic purpose and human utilization applied to the land (e.g., commercial agriculture, urban residential, industrial manufacturing, nature reserve).

### GeoVision 5-Class LULC Scheme:
1. **Vegetation** (`#10b981`, Class 1): Closed-canopy forest, woodlands, nature reserves, and urban parks.
2. **Water Bodies** (`#06b6d4`, Class 2): Open rivers, lakes, reservoirs, ponds, wetlands, and canal networks.
3. **Built-up / Urban** (`#f43f5e`, Class 3): Residential dwellings, commercial centers, industrial factories, paved roads, and concrete infrastructure.
4. **Agriculture** (`#f59e0b`, Class 4): Cultivated crop fields, irrigated farms, orchards, and seasonal agricultural plots.
5. **Bare Land** (`#a16207`, Class 5): Exposed soil, sand dunes, barren rock outcroppings, and fallow unmanaged parcels.

## 3. Coordinate Systems & Geodesic Calculations
- **Geographic CRS (EPSG:4326 / WGS84)**: Angular coordinates (longitude, latitude in degrees). Accurate area calculations must apply ellipsoidal geodesic formulas ($a=6378137.0\text{ m}, 1/f=298.257223563$).
- **Projected CRS (UTM Zones, e.g., EPSG:32643)**: Planar conformal projection in meters; ideal for spatial buffer computation, distance measurement, and spatial clipping.

## 4. Multi-Temporal Transition Matrix Formulation
In change detection between baseline $T_1$ and recent $T_2$, the transition matrix $M$ quantifies cross-class dynamics:
$$M = \begin{bmatrix} M_{11} & \cdots & M_{1N} \\ \vdots & \ddots & \vdots \\ M_{N1} & \cdots & M_{NN} \end{bmatrix}$$
- **Diagonal Elements ($M_{ii}$)**: Unchanged stable area for class $i$.
- **Off-Diagonal Row Elements ($M_{ij}, j \ne i$)**: Gross loss of class $i$ converted to other classes.
- **Off-Diagonal Column Elements ($M_{ji}, j \ne i$)**: Gross gain of class $i$ converted from other classes.
- **Net Change**: $\Delta A_i = \text{Gain}_i - \text{Loss}_i = \sum_{k=1}^N M_{ki} - \sum_{k=1}^N M_{ik}$.
