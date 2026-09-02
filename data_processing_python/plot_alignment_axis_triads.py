#!/usr/bin/env python3
"""Compact rigid-alignment figure for chromosome structures.

The script reproduces MultiPASE's deterministic PCA + rigid ICP transform,
then applies that exact orthogonal transform to both the VACV points and its
local XYZ triad. No display-time scaling or deformation is applied to either
point cloud.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.gridspec import GridSpec
from mpase.point_alignment import best_pca_prealign, icp_rigid_robust


HERE = Path(__file__).resolve().parent
DEFAULT_DATA_ROOT = HERE / "data" / "green_monkey"

UNTR_COLOR = "#2C7FB8"
VACV_COLOR = "#E66101"
AXIS_NAMES = ("X", "Y", "Z")
AXIS_COLORS = ("#D62728", "#2CA02C", "#3366CC")
VIEW_ELEV = 20
VIEW_AZIM = -58


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromosome", default="chr12")
    parser.add_argument("--time", default="12hrs")
    parser.add_argument("--data-root", type=Path, default=DEFAULT_DATA_ROOT)
    parser.add_argument("--output-dir", type=Path, default=HERE / "figures")
    return parser.parse_args()


def load_xyz(path: Path) -> np.ndarray:
    with path.open(newline="") as handle:
        rows = csv.DictReader(handle)
        points = np.asarray(
            [[float(row[axis]) for axis in ("x", "y", "z")] for row in rows],
            dtype=float,
        )
    if points.ndim != 2 or points.shape[1] != 3:
        raise ValueError(f"Expected an N x 3 point array in {path}")
    return points


def reproduce_mpase_rigid_transform(
    reference_points: np.ndarray,
    moving_points: np.ndarray,
) -> tuple[np.ndarray, np.ndarray]:
    """Return the exact orthogonal transform used before MPASE display scaling.

    With row-vector points, the returned transform is applied as:
        moving_after = moving_before @ rotation.T + translation
    """
    pre_rotation = best_pca_prealign(moving_points, reference_points)
    prealigned = moving_points @ pre_rotation.T
    icp_rotation, translation = icp_rigid_robust(
        reference_points,
        prealigned,
        iters=30,
        sample=50000,
        trim_q=0.10,
        seed=11,
    )
    rotation = icp_rotation @ pre_rotation
    return rotation, translation


def draw_orientation_triad(
    ax,
    origin: np.ndarray,
    orientation: np.ndarray,
    length: float,
    linewidth: float = 3.2,
) -> None:
    """Draw local X/Y/Z directions using the columns of ``orientation``."""
    origin = np.asarray(origin, dtype=float)
    orientation = np.asarray(orientation, dtype=float)
    if orientation.shape != (3, 3):
        raise ValueError("orientation must be a 3 x 3 matrix")

    # A small white center marker makes the triad readable through the cloud.
    ax.scatter(
        *origin,
        s=55,
        color="white",
        alpha=0.78,
        edgecolors="none",
        depthshade=False,
        zorder=20,
    )

    for axis_index, (name, color) in enumerate(zip(AXIS_NAMES, AXIS_COLORS)):
        direction = orientation[:, axis_index]
        endpoint = origin + length * direction
        label_position = origin + 1.14 * length * direction
        ax.plot(
            [origin[0], endpoint[0]],
            [origin[1], endpoint[1]],
            [origin[2], endpoint[2]],
            color=color,
            linewidth=linewidth,
            solid_capstyle="round",
            zorder=25,
        )
        ax.text(
            *label_position,
            name,
            color=color,
            fontsize=12,
            fontweight="bold",
            ha="center",
            va="center",
            bbox={
                "boxstyle": "round,pad=0.10",
                "facecolor": "white",
                "edgecolor": "none",
                "alpha": 0.72,
            },
            clip_on=False,
            zorder=30,
        )


def draw_point_cloud(ax, points: np.ndarray, color: str) -> None:
    ax.scatter(
        points[:, 0],
        points[:, 1],
        points[:, 2],
        s=8.0,
        color=color,
        alpha=0.58,
        edgecolors="none",
        depthshade=True,
        rasterized=True,
        zorder=2,
    )


def style_panel(
    ax,
    points: np.ndarray,
    triad_origin: np.ndarray,
    triad_orientation: np.ndarray,
    triad_length: float,
) -> None:
    """Tightly frame the unchanged cloud and triad with equal XYZ scaling."""
    # Include the label positions just beyond each triad endpoint so no axis
    # line or X/Y/Z label is clipped by the tighter panel bounds.
    triad_extent = np.vstack(
        [
            triad_origin,
            triad_origin + 1.18 * triad_length * triad_orientation.T,
        ]
    )
    complete_extent = np.vstack([points, triad_extent])
    low = complete_extent.min(axis=0)
    high = complete_extent.max(axis=0)
    center = (low + high) / 2
    # A modest projection-safe buffer prevents oblique 3D points from being
    # clipped by the rectangular Axes patch while retaining a tight frame.
    half = float(np.max(high - low)) * 0.58
    ax.set_xlim(center[0] - half, center[0] + half)
    ax.set_ylim(center[1] - half, center[1] + half)
    ax.set_zlim(center[2] - half, center[2] + half)
    # ``zoom`` compensates for the generous internal padding reserved by
    # Matplotlib's 3D axes. It changes only framing, not data coordinates.
    ax.set_box_aspect((1, 1, 1), zoom=1.42)
    ax.view_init(elev=VIEW_ELEV, azim=VIEW_AZIM)
    ax.set_proj_type("ortho")
    ax.set_axis_off()


def normalized_mismatch(a: np.ndarray, b: np.ndarray) -> float:
    def normalize(points: np.ndarray) -> np.ndarray:
        centered = points - points.mean(axis=0)
        radius = np.sqrt(np.mean(np.sum(centered * centered, axis=1)))
        return centered / radius

    return float(np.sqrt(np.mean(np.sum((normalize(a) - normalize(b)) ** 2, axis=1))))


def main() -> None:
    args = parse_args()
    chromosome = args.chromosome
    time = args.time

    untr_path = (
        args.data_root
        / "all_structure_files"
        / chromosome
        / time
        / "untr"
        / f"structure_{time}_untr_with_id0.csv"
    )
    vacv_path = (
        args.data_root
        / "all_structure_files"
        / chromosome
        / time
        / "vacv"
        / f"structure_{time}_vacv_with_id0.csv"
    )

    untr_raw = load_xyz(untr_path)
    vacv_raw = load_xyz(vacv_path)
    if untr_raw.shape != vacv_raw.shape:
        raise ValueError(
            f"UNTR and VACV must contain corresponding points: "
            f"{untr_raw.shape} != {vacv_raw.shape}"
        )

    # MultiPASE centers every input before alignment. Centering is translation
    # only and therefore preserves the exact geometry of both structures.
    untr_before = untr_raw - untr_raw.mean(axis=0)
    vacv_before = vacv_raw - vacv_raw.mean(axis=0)

    rotation, translation = reproduce_mpase_rigid_transform(
        untr_before,
        vacv_before,
    )
    untr_after = untr_before.copy()
    vacv_after = vacv_before @ rotation.T + translation

    # UNTR is the shared/reference XYZ frame. The VACV pre-alignment frame is
    # the inverse image of that shared frame. Applying the exact same MPASE
    # transform to it produces the shared XYZ frame after alignment.
    reference_frame = np.eye(3)
    vacv_frame_before = rotation.T @ reference_frame
    vacv_frame_after = rotation @ vacv_frame_before

    point_sets = (
        (untr_before, vacv_before),
        (untr_after, vacv_after),
    )
    frame_sets = (
        (reference_frame, vacv_frame_before),
        (reference_frame, vacv_frame_after),
    )
    colors = (UNTR_COLOR, VACV_COLOR)

    # A common cube width preserves visual scale across all four panels.
    shared_span = max(float(np.max(np.ptp(points, axis=0))) for row in point_sets for points in row)
    triad_length = shared_span * 0.23

    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "figure.dpi": 160,
            "savefig.facecolor": "white",
        }
    )
    fig = plt.figure(figsize=(7.20, 5.75), facecolor="white")
    grid = GridSpec(
        2,
        2,
        figure=fig,
        left=0.040,
        right=0.995,
        bottom=0.025,
        top=0.880,
        wspace=-0.38,
        hspace=-0.34,
    )

    for row in range(2):
        for column in range(2):
            ax = fig.add_subplot(grid[row, column], projection="3d")
            points = point_sets[row][column]
            triad_origin = points.mean(axis=0)
            triad_orientation = frame_sets[row][column]
            style_panel(
                ax,
                points,
                triad_origin,
                triad_orientation,
                triad_length,
            )
            draw_point_cloud(ax, points, colors[column])
            draw_orientation_triad(
                ax,
                origin=triad_origin,
                orientation=triad_orientation,
                length=triad_length,
                linewidth=3.2,
            )

    fig.suptitle(
        f"{chromosome.replace('chr', 'Chromosome ')}, {time}",
        fontsize=18,
        fontweight="normal",
        y=0.982,
    )
    fig.text(0.315, 0.900, "UNTR", color=UNTR_COLOR, fontsize=15, ha="center")
    fig.text(0.705, 0.900, "VACV", color=VACV_COLOR, fontsize=15, ha="center")
    fig.text(
        0.016,
        0.655,
        "Before alignment",
        rotation=90,
        fontsize=12,
        ha="center",
        va="center",
    )
    fig.text(
        0.016,
        0.270,
        "After alignment",
        rotation=90,
        fontsize=12,
        ha="center",
        va="center",
    )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    stem = args.output_dir / f"{chromosome}_{time}_alignment_axis_triads"
    for extension in ("png", "svg", "pdf"):
        output = stem.with_suffix(f".{extension}")
        fig.savefig(output, dpi=320, bbox_inches="tight", pad_inches=0.05)
        print(f"Saved {output}")
    plt.close(fig)

    distance_error = float(
        np.max(
            np.abs(
                np.linalg.norm(np.diff(vacv_before, axis=0), axis=1)
                - np.linalg.norm(np.diff(vacv_after, axis=0), axis=1)
            )
        )
    )
    report = {
        "chromosome": chromosome,
        "time": time,
        "point_count_per_condition": int(len(untr_before)),
        "point_transform_row_vector_convention": "after = before @ rotation.T + translation",
        "rotation_or_orthogonal_matrix": rotation.tolist(),
        "translation": translation.tolist(),
        "determinant": float(np.linalg.det(rotation)),
        "orthogonality_error": float(np.linalg.norm(rotation.T @ rotation - np.eye(3))),
        "maximum_consecutive_distance_error": distance_error,
        "mismatch_before": normalized_mismatch(untr_before, vacv_before),
        "mismatch_after": normalized_mismatch(untr_after, vacv_after),
        "sources": [str(untr_path), str(vacv_path)],
    }
    report_path = stem.with_name(stem.name + "_transform.json")
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Saved {report_path}")


if __name__ == "__main__":
    main()
