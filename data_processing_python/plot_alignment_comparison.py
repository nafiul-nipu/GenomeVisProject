#!/usr/bin/env python3
"""Create a 2 x 2 before/after MultiPASE alignment figure.

The columns show the untreated and VACV-infected conditions. The rows show
original and aligned XYZ coordinates for the same ordered chromatin beads.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


CONDITIONS = (
    ("untr", "Untreated", "#2878B5"),
    ("vacv", "VACV-infected", "#D55E00"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromosome", default="chr1")
    parser.add_argument("--time", default="12hrs")
    parser.add_argument(
        "--data-root",
        type=Path,
        default=Path(__file__).resolve().parent / "data" / "green_monkey",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "figures",
    )
    parser.add_argument(
        "--annotate-vacv-axes",
        action="store_true",
        help="Label aligned VACV axes with their dominant pre-alignment axes.",
    )
    return parser.parse_args()


def load_raw(path: Path) -> np.ndarray:
    with path.open(newline="") as handle:
        rows = csv.DictReader(handle)
        return np.asarray(
            [[float(row[axis]) for axis in ("x", "y", "z")] for row in rows],
            dtype=float,
        )


def load_aligned(path: Path) -> np.ndarray:
    with path.open() as handle:
        payload = json.load(handle)
    return np.asarray(payload["positions"], dtype=float)


def equal_limits(point_sets: list[np.ndarray], padding: float = 0.08):
    points = np.vstack(point_sets)
    low = points.min(axis=0)
    high = points.max(axis=0)
    center = (low + high) / 2
    half_span = max(high - low) * (0.5 + padding)
    return tuple((c - half_span, c + half_span) for c in center)


def style_axis(ax, limits, axis_labels=("X", "Y", "Z")) -> None:
    ax.set_xlim(limits[0])
    ax.set_ylim(limits[1])
    ax.set_zlim(limits[2])
    ax.set_box_aspect((1, 1, 1))
    ax.set_xlabel(axis_labels[0], labelpad=6)
    ax.set_ylabel(axis_labels[1], labelpad=6)
    ax.set_zlabel(axis_labels[2], labelpad=6)
    ax.view_init(elev=21, azim=-58)
    ax.grid(True, linewidth=0.35, alpha=0.3)
    ax.tick_params(labelsize=7, pad=1)
    for axis in (ax.xaxis, ax.yaxis, ax.zaxis):
        axis.pane.set_facecolor((0.985, 0.985, 0.985, 1))
        axis.pane.set_edgecolor((0.88, 0.88, 0.88, 1))


def draw_structure(ax, points: np.ndarray, color: str) -> None:
    # Connect the original ordered beads without altering their geometry.
    # The connector is deliberately subtle so the measured beads dominate.
    ax.plot(
        points[:, 0],
        points[:, 1],
        points[:, 2],
        color=color,
        linewidth=0.42,
        alpha=0.24,
        antialiased=True,
        zorder=1,
    )
    ax.scatter(
        points[:, 0],
        points[:, 1],
        points[:, 2],
        color=color,
        s=8.5,
        alpha=0.88,
        depthshade=True,
        edgecolors="white",
        linewidths=0.12,
        zorder=3,
    )


def main() -> None:
    args = parse_args()
    raw: dict[str, np.ndarray] = {}
    aligned: dict[str, np.ndarray] = {}
    sources: list[Path] = []

    for condition, _, _ in CONDITIONS:
        raw_path = (
            args.data_root
            / "all_structure_files"
            / args.chromosome
            / args.time
            / condition
            / f"structure_{args.time}_{condition}_with_id0.csv"
        )
        aligned_path = (
            args.data_root
            / "structure_beads_aligned"
            / args.chromosome
            / f"{args.chromosome}_{args.time}_{condition}_aligned.json"
        )
        raw[condition] = load_raw(raw_path)
        aligned[condition] = load_aligned(aligned_path)
        sources.extend((raw_path, aligned_path))
        if raw[condition].shape != aligned[condition].shape:
            raise ValueError(
                f"Point-count mismatch for {condition}: "
                f"{raw[condition].shape} vs {aligned[condition].shape}"
            )

    # Fit each panel independently. The original coordinate frames are far
    # apart, so global row limits make the unaligned structures appear tiny.
    # Every panel still uses an equal XYZ cube and displays its true values.
    panel_limits = {
        ("raw", condition): equal_limits([raw[condition]], padding=0.12)
        for condition, _, _ in CONDITIONS
    }
    panel_limits.update(
        {
            ("aligned", condition): equal_limits([aligned[condition]], padding=0.12)
            for condition, _, _ in CONDITIONS
        }
    )

    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "axes.labelsize": 8,
            "axes.titlesize": 11,
            "figure.dpi": 160,
        }
    )
    figure_size = (11.2, 9.2) if args.annotate_vacv_axes else (10.7, 9.0)
    fig = plt.figure(figsize=figure_size, constrained_layout=False)
    grid_left = 0.035 if args.annotate_vacv_axes else 0.105
    grid_right = 0.93
    grid_bottom = 0.07 if args.annotate_vacv_axes else 0.14
    grid_wspace = 0.02 if args.annotate_vacv_axes else 0.10
    grid = fig.add_gridspec(
        2,
        2,
        left=grid_left,
        right=grid_right,
        bottom=grid_bottom,
        top=0.88,
        wspace=grid_wspace,
        hspace=0.12,
    )

    for column, (condition, title, color) in enumerate(CONDITIONS):
        for row, (stage, data) in enumerate(
            (("raw", raw[condition]),
             ("aligned", aligned[condition]))
        ):
            ax = fig.add_subplot(grid[row, column], projection="3d")
            draw_structure(ax, data, color)
            axis_labels = ("X", "Y", "Z")
            if args.annotate_vacv_axes and stage == "aligned" and condition == "vacv":
                axis_labels = (
                    "X\n(previous Y)",
                    "Y\n(previous −X)",
                    "Z\n(previous −Z)",
                )
            style_axis(ax, panel_limits[(stage, condition)], axis_labels)
            if args.annotate_vacv_axes and stage == "aligned" and condition == "vacv":
                for axis in (ax.xaxis, ax.yaxis, ax.zaxis):
                    axis.label.set_fontsize(7.5)
                    axis.labelpad = 3
                ax.zaxis.labelpad = -2
            if row == 0:
                ax.set_title(title, color=color, fontweight="bold", pad=12)

    fig.suptitle(
        f"3D chromosome structure before and after alignment\n"
        f"{args.chromosome.replace('chr', 'Chromosome ')} · {args.time.replace('hrs', ' h')}",
        fontsize=15,
        fontweight="bold",
        y=0.965,
    )
    fig.text(
        0.012 if args.annotate_vacv_axes else 0.025,
        0.68,
        "Before alignment",
        rotation=90,
        ha="center",
        va="center",
        fontsize=11,
        fontweight="bold",
    )
    fig.text(
        0.012 if args.annotate_vacv_axes else 0.025,
        0.285,
        "After alignment",
        rotation=90,
        ha="center",
        va="center",
        fontsize=11,
        fontweight="bold",
    )
    args.output_dir.mkdir(parents=True, exist_ok=True)
    suffix = "_vacv_axis_labels" if args.annotate_vacv_axes else ""
    stem = f"{args.chromosome}_{args.time}_alignment_comparison{suffix}"
    for extension in ("png", "svg", "pdf"):
        output = args.output_dir / f"{stem}.{extension}"
        fig.savefig(
            output,
            dpi=320,
            bbox_inches=None if args.annotate_vacv_axes else "tight",
            pad_inches=0.28,
            facecolor="white",
        )
        print(f"Saved {output}")
    plt.close(fig)

    manifest = {
        "chromosome": args.chromosome,
        "time": args.time,
        "conditions": [condition for condition, _, _ in CONDITIONS],
        "vacv_aligned_axis_labels": (
            ["X (previous Y)", "Y (previous -X)", "Z (previous -Z)"]
            if args.annotate_vacv_axes
            else None
        ),
        "point_count_per_condition": int(raw["untr"].shape[0]),
        "panel_xyz_limits": {
            f"{stage}_{condition}": [[float(v) for v in pair] for pair in limits]
            for (stage, condition), limits in panel_limits.items()
        },
        "sources": [str(path) for path in sources],
    }
    manifest_path = args.output_dir / f"{stem}_data_sources.json"
    with manifest_path.open("w") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
    print(f"Saved {manifest_path}")


if __name__ == "__main__":
    main()
