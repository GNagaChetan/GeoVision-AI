# Digital Image Processing: Theory & Algorithms

## 1. Explain Histogram Equalization
**Histogram Equalization** is a fundamental spatial-domain image contrast enhancement technique. Its objective is to transform the discrete intensity distribution (histogram) of an input image into a uniform probability density function (PDF), thereby spreading out the most frequent intensity values across the full dynamic range ($[0, L-1]$).

### Mathematical Formulation
For an image with $L$ gray levels ($L = 256$ for 8-bit imagery), the continuous transformation function is given by the cumulative distribution function (CDF):
$$s = T(r) = (L - 1) \int_0^r p_r(w) dw$$

For discrete digital images of size $M \times N$:
$$s_k = T(r_k) = (L - 1) \sum_{j=0}^k p_r(r_j) = \frac{L - 1}{M \cdot N} \sum_{j=0}^k n_j$$
Where:
- $r_k$ is the input intensity level normalized to $[0, 1]$ or $[0, 255]$.
- $n_j$ is the number of pixels with gray level $r_j$.
- $MN$ is the total pixel count in the raster.
- $s_k$ is the equalized output intensity value.

### Contrast Limited Adaptive Histogram Equalization (CLAHE)
While global histogram equalization improves low-contrast images, it tends to over-amplify noise in homogeneous regions. **CLAHE** resolves this by dividing the image into small contextual tiles (e.g., $8 \times 8$), computing local histograms, clipping histogram bins that exceed a defined clip limit $\beta$, redistributing the clipped pixels uniformly across all bins, and smoothly blending tile boundaries using bilinear interpolation.

## 2. Image Processing Methods Implemented in GeoVision AI

### Spatial Domain Filtering
- **Gaussian Smoothing**: Linear low-pass convolution filter attenuating high-frequency noise: $G(x,y) = \frac{1}{2\pi\sigma^2} e^{-(x^2+y^2)/(2\sigma^2)}$.
- **Median Despeckling**: Non-linear order-statistic filter replacing the central pixel with the median value in the neighborhood, removing salt-and-pepper noise while preserving sharp linear edges.
- **Laplacian Sharpening**: Second-order derivative filter highlighting fine edge details: $\nabla^2 f = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2}$.

### Multi-Operator Edge Detection
- **Sobel Operator**: First-order derivative operator with orthogonal smoothing weights:
  $$K_x = \begin{bmatrix}-1 & 0 & 1\\ -2 & 0 & 2\\ -1 & 0 & 1\end{bmatrix}, \quad K_y = \begin{bmatrix}-1 & -2 & -1\\ 0 & 0 & 0\\ 1 & 2 & 1\end{bmatrix}$$
- **Prewitt Operator**: Unweighted first-derivative gradient kernel.
- **Roberts Cross**: Diagonal $2 \times 2$ difference operator for high-speed edge localization.
- **Canny Edge Detector**: Four-stage optimal detector: (1) Gaussian smoothing, (2) Gradient magnitude and angle calculation, (3) Non-maximum suppression, (4) Hysteresis thresholding ($T_{high}, T_{low}$).

### Frequency Domain Processing (2D-DFT & FFT)
Transforms spatial images into frequency spectra:
$$F(u,v) = \sum_{x=0}^{M-1}\sum_{y=0}^{N-1} f(x,y) e^{-j2\pi\left(\frac{ux}{M} + \frac{vy}{N}\right)}$$
Magnitude spectrum is displayed in logarithmic scale: $|F(u,v)|_{dB} = 20\log_{10}(1 + |F(u,v)|)$.

### Image Segmentation & Thresholding
- **Otsu Automatic Thresholding**: Maximizes between-class variance ($\sigma_B^2$) to automatically partition bimodal histograms into foreground and background.
- **Adaptive Gaussian Thresholding**: Computes local pixel-specific thresholds based on Gaussian-weighted neighborhood means.
- **Color K-Means Clustering**: Unsupervised segmentation partitioning multidimensional color space into $K$ distinct spectral clusters.

### Image Registration & Alignment
- **Feature-Based Registration (ORB & ECC)**: Detects Oriented FAST and Rotated BRIEF keypoints, matches feature descriptors, computes homography or affine transformation matrices using RANSAC, and warps target rasters to achieve sub-pixel spatial alignment.

### Image Quality & Fidelity Metrics
- **Mean Squared Error (MSE)**: $\text{MSE} = \frac{1}{MN}\sum_{x=0}^{M-1}\sum_{y=0}^{N-1} [f(x,y) - \hat{f}(x,y)]^2$
- **Peak Signal-to-Noise Ratio (PSNR)**: $\text{PSNR} = 10\log_{10}\left(\frac{255^2}{\text{MSE}}\right)\text{ dB}$
- **Structural Similarity Index (SSIM)**: Multi-scale index assessing luminance, contrast, and structural correlation.
