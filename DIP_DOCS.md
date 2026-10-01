# Digital Image Processing (DIP) Engine — Theoretical & Algorithmic Documentation

## 1. Overview
The GeoVision DIP Engine provides an academic and production-ready implementation of fundamental and advanced digital image processing techniques across spatial and frequency domains.

All algorithms are implemented using **OpenCV**, **NumPy**, and **scikit-image**, with full mathematical traceability to *Gonzalez & Woods, Digital Image Processing (4th Edition)*.

---

## 2. Implemented Algorithms & Mathematical Formulations

### 2.1 Spatial Domain Enhancement
1. **Global Histogram Equalization**:
   - Spreads out the most frequent intensity values across the full dynamic range $[0, L-1]$.
   - Continuous transformation: $s = T(r) = (L-1)\int_0^r p_r(w)dw$
   - Discrete formulation:
     $$s_k = T(r_k) = (L-1)\sum_{j=0}^k p_r(r_j) = \frac{L-1}{MN}\sum_{j=0}^k n_j$$

2. **Contrast Limited Adaptive Histogram Equalization (CLAHE)**:
   - Partitions image into non-overlapping contextual tiles ($M_t \times N_t$, typically $8 \times 8$).
   - Imposes a clipping limit $\beta$ on local histograms to prevent noise over-amplification:
     $$\text{Clip Level } N_{clip} = \frac{M_t \times N_t}{L} \left(1 + \frac{\beta}{100}(S_{max} - 1)\right)$$
   - Redistributes clipped pixels uniformly across gray levels and blends tile borders with bilinear interpolation.

3. **Linear Contrast Stretching**:
   - Stretches intensity distribution between 2nd ($f_{min}$) and 98th ($f_{max}$) percentiles:
     $$g(x,y) = \text{clip}\left(\frac{f(x,y) - f_{min}}{f_{max} - f_{min}} \times 255, 0, 255\right)$$

---

### 2.2 Spatial Domain Filtering
1. **Mean Box Filter**:
   - Moving spatial average for linear low-pass smoothing:
     $$g(x,y) = \frac{1}{K \times K} \sum_{i=-a}^a \sum_{j=-b}^b f(x+i, y+j)$$

2. **Median Filter (Despeckling)**:
   - Non-linear order-statistic filter:
     $$g(x,y) = \text{median}\left\{f(x+i, y+j) \mid (i,j) \in S_{xy}\right\}$$
   - Excellent for satellite speckle and impulsive salt-and-pepper noise without blurring edge boundaries.

3. **Gaussian Smoothing**:
   - 2D circularly symmetric Gaussian low-pass convolution:
     $$G(x,y) = \frac{1}{2\pi\sigma^2} \exp\left(-\frac{x^2+y^2}{2\sigma^2}\right)$$

4. **Laplacian Sharpening & Unsharp Masking**:
   - Second-derivative edge enhancer:
     $$\nabla^2 f(x,y) = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2}$$
     $$g(x,y) = f(x,y) + k \cdot [f(x,y) - \bar{f}(x,y)]$$

---

### 2.3 Edge Detection Operators
1. **Sobel Gradient Operator**:
   - First-order gradient with smoothed orthogonal filtering:
     $$K_x = \begin{bmatrix}-1 & 0 & 1\\ -2 & 0 & 2\\ -1 & 0 & 1\end{bmatrix}, \quad K_y = \begin{bmatrix}-1 & -2 & -1\\ 0 & 0 & 0\\ 1 & 2 & 1\end{bmatrix}$$
     $$M(x,y) = \sqrt{G_x^2 + G_y^2}, \quad \alpha(x,y) = \arctan\left(\frac{G_y}{G_x}\right)$$

2. **Prewitt Operator**:
   - Unweighted directional derivative kernels.

3. **Roberts Cross**:
   - Diagonal $2 \times 2$ difference operators:
     $$G_x = f(x,y) - f(x+1, y+1), \quad G_y = f(x+1, y) - f(x, y+1)$$

4. **Canny Multi-Stage Detector**:
   - 4-stage optimal edge detection:
     1. Gaussian smoothing ($\sigma=1.5$).
     2. Directional gradient magnitude ($M$) and angle ($\theta$).
     3. Non-Maximum Suppression (thinning gradient ridges to 1-pixel width).
     4. Hysteresis Thresholding with dual thresholds ($T_{low}, T_{high}$).

---

### 2.4 Segmentation & Thresholding
1. **Otsu Global Thresholding**:
   - Maximizes inter-class variance $\sigma_B^2(t)$:
     $$\sigma_B^2(t) = \omega_0(t)\omega_1(t)[\mu_0(t) - \mu_1(t)]^2$$
     $$t^* = \arg\max_t \sigma_B^2(t)$$

2. **Multi-Otsu Multi-Thresholding**:
   - Extends Otsu criterion to partition the gray level spectrum into $K$ discrete classes ($K \in [2, 5]$).

3. **Adaptive Gaussian Thresholding**:
   - Calculates local threshold $T(x,y) = \text{WeightedGaussian}(S_{xy}) - C$.

4. **K-Means Color Clustering**:
   - Iterative centroid optimization:
     $$J = \sum_{j=1}^K \sum_{i=1}^{N_j} \|x_i^{(j)} - c_j\|^2$$

---

### 2.5 Frequency Domain (2D-DFT)
- **2D Discrete Fourier Transform**:
  $$F(u,v) = \sum_{x=0}^{M-1}\sum_{y=0}^{N-1} f(x,y) e^{-j2\pi\left(\frac{ux}{M} + \frac{vy}{N}\right)}$$
- **Magnitude Spectrum Display**:
  $$|F(u,v)|_{dB} = 20 \log_{10}(1 + |F(u,v)|)$$

---

### 2.6 Objective Quality Metrics
1. **Mean Squared Error (MSE)**:
   $$\text{MSE} = \frac{1}{MN}\sum_{x=0}^{M-1}\sum_{y=0}^{N-1} [f(x,y) - \hat{f}(x,y)]^2$$

2. **Peak Signal-to-Noise Ratio (PSNR)**:
   $$\text{PSNR} = 10 \log_{10}\left(\frac{255^2}{\text{MSE}}\right) \text{ dB}$$

3. **Structural Similarity Index (SSIM)**:
   $$\text{SSIM}(x,y) = \frac{(2\mu_x\mu_y + C_1)(2\sigma_{xy} + C_2)}{(\mu_x^2 + \mu_y^2 + C_1)(\sigma_x^2 + \sigma_y^2 + C_2)}$$

---

### 2.7 Image Registration
- **ORB (Oriented FAST and Rotated BRIEF)** feature detector and binary descriptor extraction.
- **Brute-Force / FLANN Hamming Matcher** with distance cross-checking.
- **RANSAC Homography ($H \in \mathbb{R}^{3\times3}$)** estimation and perspective warping:
  $$\begin{bmatrix}x' \\ y' \\ 1\end{bmatrix} \sim H \begin{bmatrix}x \\ y \\ 1\end{bmatrix}$$
