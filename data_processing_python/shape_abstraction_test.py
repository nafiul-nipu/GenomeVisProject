#!/usr/bin/env python3
# === TEST: Ellipsoid Glyphs + COM Arrow + 2D Difference Map (MOCK DATA ONLY) ===
# - Run: python shape_abstraction_demo.py
# - Opens all figures and keeps them open until you close them.

import numpy as np
import matplotlib.pyplot as plt
from dataclasses import dataclass
from typing import Dict, Tuple

# Optional: if your environment complains about a backend, try:
# import matplotlib; matplotlib.use("TkAgg")

np.random.seed(7)

# ----------------------------- Controls -----------------------------
TIMEPOINTS = ["12h", "18h", "24h"]
N_POINTS = 1000
ELLIPSOID_SCALE = 2.0
DENSITY_RES = 256
DENSITY_SIGMA = 2.0
SCATTER_STRIDE = max(1, N_POINTS // 200)

# ----------------------------- Helpers -----------------------------
@dataclass
class EllipsoidGlyph:
    center: np.ndarray
    axes: np.ndarray
    R: np.ndarray
    volume: float

def fit_ellipsoid_pca(points: np.ndarray, scale: float = ELLIPSOID_SCALE) -> EllipsoidGlyph:
    center = points.mean(axis=0)
    X = points - center
    C = np.cov(X.T)
    vals, vecs = np.linalg.eigh(C)
    idx = np.argsort(vals)[::-1]
    vals = vals[idx]; vecs = vecs[:, idx]
    radii = scale * np.sqrt(np.maximum(vals, 1e-12))
    volume = 4/3 * np.pi * np.prod(radii)
    return EllipsoidGlyph(center, radii, vecs, volume)

def plot_ellipsoid(ax, glyph: EllipsoidGlyph, alpha=0.25, wire=False):
    u = np.linspace(0, 2*np.pi, 36)
    v = np.linspace(0, np.pi, 24)
    x = glyph.axes[0] * np.outer(np.cos(u), np.sin(v))
    y = glyph.axes[1] * np.outer(np.sin(u), np.sin(v))
    z = glyph.axes[2] * np.outer(np.ones_like(u), np.cos(v))
    E = np.stack([x, y, z], axis=-1).reshape(-1, 3) @ glyph.R.T
    E = E.reshape(x.shape + (3,))
    X = E[...,0] + glyph.center[0]
    Y = E[...,1] + glyph.center[1]
    Z = E[...,2] + glyph.center[2]
    if wire:
        ax.plot_wireframe(X, Y, Z, rstride=2, cstride=2, alpha=alpha)
    else:
        ax.plot_surface(X, Y, Z, alpha=alpha)

def com_arrow(ax, c0, c1):
    d = c1 - c0
    ax.quiver(c0[0], c0[1], c0[2], d[0], d[1], d[2], length=1.0, normalize=False)

def make_density(img_size: int, pts: np.ndarray, bounds: Tuple[np.ndarray, np.ndarray], sigma_px: float = DENSITY_SIGMA):
    lo, hi = bounds
    xy = pts[:, :2]
    xy_norm = (xy - lo[:2]) / (hi[:2] - lo[:2] + 1e-9)
    px = np.clip((xy_norm * (img_size - 1)).astype(int), 0, img_size - 1)
    img = np.zeros((img_size, img_size), dtype=float)
    for i, j in px:
        img[j, i] += 1.0
    r = int(3*sigma_px)
    x = np.arange(-r, r+1)
    k = np.exp(-(x**2)/(2*sigma_px**2)); k /= k.sum()
    tmp = np.zeros_like(img)
    for y in range(img_size):
        row = img[y]
        padded = np.pad(row, (r, r), mode='edge')
        for x0 in range(img_size):
            tmp[y, x0] = np.dot(k, padded[x0:x0+2*r+1])
    out = np.zeros_like(img)
    for x0 in range(img_size):
        col = tmp[:, x0]
        padded = np.pad(col, (r, r), mode='edge')
        for y0 in range(img_size):
            out[y0, x0] = np.dot(k, padded[y0:y0+2*r+1])
    return out

def synth_cloud(center, scales, n=N_POINTS, rot_angle=0.0):
    cov = np.diag(np.array(scales)**2)
    pts = np.random.multivariate_normal(mean=[0,0,0], cov=cov, size=n)
    Rz = np.array([[np.cos(rot_angle), -np.sin(rot_angle), 0],
                   [np.sin(rot_angle),  np.cos(rot_angle), 0],
                   [0, 0, 1]])
    return pts @ Rz.T + np.array(center)

# ----------------------------- Mock data -----------------------------
data: Dict[str, Dict[str, np.ndarray]] = {}
for t_idx, tp in enumerate(TIMEPOINTS):
    shift = np.array([t_idx*2.0, 0.5*t_idx, 0.0])
    untr = synth_cloud(shift + np.array([0,0,0]), [3.0, 2.0, 1.5], rot_angle=0.2*t_idx)
    vacv = synth_cloud(shift + np.array([1.0, 0.6, 0.2]), [3.8, 2.2, 1.6], rot_angle=0.5 + 0.25*t_idx)
    data[tp] = {"UNTR": untr, "VACV": vacv}

# ----------------------------- Show: 3D glyphs per timepoint -----------------------------
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401
for tp in TIMEPOINTS:
    fig = plt.figure(figsize=(6,6))
    ax = fig.add_subplot(111, projection='3d')
    ax.set_title(f"Ellipsoid Glyphs + COM Shift — {tp}")
    g_untr = fit_ellipsoid_pca(data[tp]["UNTR"])
    g_vacv = fit_ellipsoid_pca(data[tp]["VACV"])
    plot_ellipsoid(ax, g_untr, alpha=0.25, wire=True)
    plot_ellipsoid(ax, g_vacv, alpha=0.25, wire=False)
    com_arrow(ax, g_untr.center, g_vacv.center)
    ax.scatter(data[tp]["UNTR"][::SCATTER_STRIDE,0], data[tp]["UNTR"][::SCATTER_STRIDE,1], data[tp]["UNTR"][::SCATTER_STRIDE,2], s=5, alpha=0.5)
    ax.scatter(data[tp]["VACV"][::SCATTER_STRIDE,0], data[tp]["VACV"][::SCATTER_STRIDE,1], data[tp]["VACV"][::SCATTER_STRIDE,2], s=5, alpha=0.5)
    all_pts = np.vstack([data[tp]["UNTR"], data[tp]["VACV"]])
    lo = all_pts.min(axis=0) - 2
    hi = all_pts.max(axis=0) + 2
    ax.set_xlim(lo[0], hi[0]); ax.set_ylim(lo[1], hi[1]); ax.set_zlim(lo[2], hi[2])
    ax.set_xlabel("X"); ax.set_ylabel("Y"); ax.set_zlabel("Z")
    plt.tight_layout()
    plt.show(block=False)   # non-blocking so we can open more

    # Let the GUI event loop breathe so the window actually draws
    plt.pause(0.01)

# ----------------------------- Show: 2D XY density difference per timepoint -----------------------------
for tp in TIMEPOINTS:
    pts_untr = data[tp]["UNTR"]; pts_vacv = data[tp]["VACV"]
    all_pts = np.vstack([pts_untr, pts_vacv])
    lo = all_pts.min(axis=0) - 2
    hi = all_pts.max(axis=0) + 2
    D_untr = make_density(DENSITY_RES, pts_untr, (lo, hi))
    D_vacv = make_density(DENSITY_RES, pts_vacv, (lo, hi))
    diff = D_vacv - D_untr
    plt.figure(figsize=(6,5))
    plt.title(f"Density Difference (VACV − UNTR), XY — {tp}")
    plt.imshow(diff, origin="lower", extent=[lo[0], hi[0], lo[1], hi[1]])
    plt.colorbar(label="Δ density")
    plt.xlabel("X"); plt.ylabel("Y")
    plt.tight_layout()
    plt.show(block=False)
    plt.pause(0.01)

print("All figures opened. They will stay up until you close them.")
# Block here so the script doesn't exit (keeps windows open)
plt.show()
