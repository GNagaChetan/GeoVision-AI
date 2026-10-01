# Digital Image Processing: Theory & Algorithms

## 1. Spatial Domain Enhancements

### Histogram Equalization
A transformation $s = T(r)$ that maps the input gray-level distribution into a uniform probability density function (PDF), maximizing global contrast:
$$s_k = T(r_k) = (L-1)\sum_{j=0}^k p_r(r_j) = \frac{L-1}{MN}\sum_{j=0}^k n_j$$
Where $L=256$ for 8-bit images, $MN$ is total pixel count, and $n_j$ is the number of pixels with gray level $r_j$.

### Contrast Limited Adaptive Histogram Equalization (CLAHE)
Standard histogram equalization over-amplifies noise in homogeneous regions. CLAHE subdivides the image into contextual tiles (typically $8\times8$), computes local histograms, clips counts exceeding a clip limit $\beta$, redistributes the clipped pixels uniformly, and blends tile boundaries using bilinear interpolation.

## 2. Spatial Domain Filtering

### Mean & Gaussian Filters (Smoothing)
Linear low-pass filters that attenuate high-frequency spatial noise.
The Gaussian kernel is defined as:
$$G(x,y) = \frac{1}{2\pi\sigma^2} e^{-\frac{x^2+y^2}{2\sigma^2}}$$
Standard deviation $\sigma$ controls the degree of blurring.

### Median Filtering (Despeckling)
A non-linear order-statistic filter replacing the central pixel with the median value within kernel $S_{xy}$. Highly effective at eliminating salt-and-pepper noise and speckle artifacts without blurring sharp linear edge boundaries.

### Sharpening & Laplacian Operator
Second-order derivative operator highlighting rapid intensity transitions:
$$\nabla^2 f = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2}$$
Unsharp masking enhances edges by adding a fraction of the high-pass difference: $f_{sharp} = f + k(f - f_{blur})$.

## 3. Edge Detection Operators

### Gradient Operators (Sobel, Prewitt, Roberts)
- **Sobel Operator**: Computes horizontal ($G_x$) and vertical ($G_y$) derivatives with weighting to smooth orthogonal noise:
  $$K_x = \begin{bmatrix}-1 & 0 & 1\\ -2 & 0 & 2\\ -1 & 0 & 1\end{bmatrix}, \quad K_y = \begin{bmatrix}-1 & -2 & -1\\ 0 & 0 & 0\\ 1 & 2 & 1\end{bmatrix}$$
- **Prewitt Operator**: Unweighted first-derivative approximation.
- **Roberts Cross**: Diagonal $2\times2$ derivative operator.

### Canny Multi-Stage Edge Detector
Optimal edge detector adhering to low error rate, localized response, and single-pixel response criteria:
1. Gaussian smoothing ($\sigma$).
2. Gradient magnitude ($M$) and direction ($\theta = \arctan(G_y/G_x)$).
3. Non-maximum suppression along gradient direction $\theta$.
4. Hysteresis thresholding with dual thresholds ($T_{high}, T_{low}$).

## 4. 2D Discrete Fourier Transform (2D-DFT)
Converts spatial domain images into spatial frequency representations:
$$F(u,v) = \sum_{x=0}^{M-1}\sum_{y=0}^{N-1} f(x,y) e^{-j2\pi\left(\frac{ux}{M} + \frac{vy}{N}\right)}$$
Magnitude spectrum is displayed in logarithmic scale: $|F(u,v)|_{dB} = 20\log_{10}(1 + |F(u,v)|)$.

## 5. Image Fidelity Metrics
- **Mean Squared Error (MSE)**: $\text{MSE} = \frac{1}{MN}\sum_{x=0}^{M-1}\sum_{y=0}^{N-1} [f(x,y) - \hat{f}(x,y)]^2$
- **Peak Signal-to-Noise Ratio (PSNR)**: $\text{PSNR} = 10\log_{10}\left(\frac{255^2}{\text{MSE}}\right)$ dB
- **Structural Similarity Index (SSIM)**: Evaluates luminance, contrast, and structural degradation.
