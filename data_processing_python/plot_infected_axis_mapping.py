#!/usr/bin/env python3
"""Visualize how the VACV input axes map into the aligned XYZ frame."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

from plot_alignment_comparison import (
    draw_structure,
    equal_limits,
    load_aligned,
    load_raw,
    style_axis,
)


HERE = Path(__file__).resolve().parent
DATA_ROOT = HERE / "data" / "green_monkey"
OUTPUT_DIR = HERE / "figures"
CHROMOSOME = "chr1"
TIME = "12hrs"
CONDITION = "vacv"

AXIS_COLORS = {
    "X": "#D62728",
    "Y": "#2CA02C",
    "Z": "#3366CC",
}


def fit_similarity_transform(raw: np.ndarray, aligned: np.ndarray):
    """Fit aligned = (raw - centroid) @ (scale * orientation) + centroid."""
    raw_center = raw.mean(axis=0)
    aligned_center = aligned.mean(axis=0)
    source = raw - raw_center
    target = aligned - aligned_center
    affine = np.linalg.lstsq(source, target, rcond=None)[0]

    # Polar decomposition yields the closest orthogonal orientation. We retain
    # a possible reflection because it is present in the saved alignment.
    left, singular_values, right_t = np.linalg.svd(affine)
    orientation = left @ right_t
    scale = float(singular_values.mean())
    predicted = source @ (scale * orientation) + aligned_center
    rmse = float(np.sqrt(np.mean(np.sum((predicted - aligned) ** 2, axis=1))))
    return raw_center, aligned_center, scale, orientation, rmse


def draw_basis(ax, origin, directions, length, suffix: str) -> None:
    for label, direction in zip(("X", "Y", "Z"), directions):
        vector = np.asarray(direction, dtype=float) * length
        color = AXIS_COLORS[label]
        ax.quiver(
            *origin,
            *vector,
            color=color,
            linewidth=2.8,
            arrow_length_ratio=0.16,
            normalize=False,
            zorder=10,
        )
        tip = np.asarray(origin) + vector * 1.12
        ax.text(
            *tip,
            f"{label}{suffix}",
            color=color,
            fontsize=10,
            fontweight="bold",
            ha="center",
            va="center",
            zorder=11,
        )
    ax.scatter(*origin, color="#222222", s=18, depthshade=False, zorder=12)


def inset_origin(limits):
    low = np.asarray([pair[0] for pair in limits])
    high = np.asarray([pair[1] for pair in limits])
    return low + 0.18 * (high - low)


def main() -> None:
    raw_path = (
        DATA_ROOT
        / "all_structure_files"
        / CHROMOSOME
        / TIME
        / CONDITION
        / f"structure_{TIME}_{CONDITION}_with_id0.csv"
    )
    aligned_path = (
        DATA_ROOT
        / "structure_beads_aligned"
        / CHROMOSOME
        / f"{CHROMOSOME}_{TIME}_{CONDITION}_aligned.json"
    )
    raw = load_raw(raw_path)
    aligned = load_aligned(aligned_path)
    _, _, scale, orientation, rmse = fit_similarity_transform(raw, aligned)

    raw_limits = equal_limits([raw], padding=0.16)
    aligned_limits = equal_limits([aligned], padding=0.16)
    raw_length = (raw_limits[0][1] - raw_limits[0][0]) * 0.20
    aligned_length = (aligned_limits[0][1] - aligned_limits[0][0]) * 0.20

    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "axes.labelsize": 9,
            "axes.titlesize": 12,
            "figure.dpi": 160,
        }
    )
    fig = plt.figure(figsize=(11.2, 5.8))
    grid = fig.add_gridspec(
        1, 2, left=0.055, right=0.94, bottom=0.17, top=0.79, wspace=0.08
    )

    before_ax = fig.add_subplot(grid[0, 0], projection="3d")
    draw_structure(before_ax, raw, "#D55E00")
    style_axis(before_ax, raw_limits)
    before_ax.set_title("Before alignment", fontweight="bold", pad=12)
    draw_basis(
        before_ax,
        inset_origin(raw_limits),
        np.eye(3),
        raw_length,
        " before",
    )

    after_ax = fig.add_subplot(grid[0, 1], projection="3d")
    draw_structure(after_ax, aligned, "#D55E00")
    style_axis(after_ax, aligned_limits)
    after_ax.set_title("After alignment", fontweight="bold", pad=12)
    draw_basis(
        after_ax,
        inset_origin(aligned_limits),
        orientation,
        aligned_length,
        " before",
    )

    fig.suptitle(
        "VACV-infected chromosome: where the original axes move",
        fontsize=16,
        fontweight="bold",
        y=0.95,
    )
    fig.text(
        0.5,
        0.075,
        r"Dominant direction:  $X_{before}\rightarrow -Y_{after}$"
        r"     $Y_{before}\rightarrow +X_{after}$"
        r"     $Z_{before}\rightarrow -Z_{after}$",
        ha="center",
        fontsize=11,
        bbox={"boxstyle": "round,pad=0.55", "facecolor": "#F6F6F6", "edgecolor": "#D4D4D4"},
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stem = OUTPUT_DIR / f"{CHROMOSOME}_{TIME}_vacv_axis_mapping"
    for extension in ("png", "svg", "pdf"):
        output = stem.with_suffix(f".{extension}")
        fig.savefig(
            output,
            dpi=320,
            bbox_inches="tight",
            pad_inches=0.28,
            facecolor="white",
        )
        print(f"Saved {output}")
    plt.close(fig)

    report = {
        "chromosome": CHROMOSOME,
        "time": TIME,
        "condition": CONDITION,
        "row_vector_convention": "original_xyz @ orientation = aligned_xyz_direction",
        "axis_order": ["X_before", "Y_before", "Z_before"],
        "orientation_rows_in_aligned_xyz": orientation.tolist(),
        "uniform_scale": scale,
        "determinant": float(np.linalg.det(orientation)),
        "fit_rmse": rmse,
        "dominant_mapping": {
            "X_before": "-Y_after",
            "Y_before": "+X_after",
            "Z_before": "-Z_after",
        },
        "sources": [str(raw_path), str(aligned_path)],
    }
    report_path = stem.with_name(stem.name + "_transform.json")
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Saved {report_path}")


if __name__ == "__main__":
    main()
