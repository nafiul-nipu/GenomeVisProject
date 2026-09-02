#!/usr/bin/env python3
"""Clean before/after alignment figure with centered colored axis triads."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

from plot_alignment_comparison import CONDITIONS, equal_limits, load_aligned, load_raw


HERE = Path(__file__).resolve().parent
DATA_ROOT = HERE / "data" / "green_monkey"
OUTPUT_DIR = HERE / "figures"
AXIS_COLORS = ("#D62728", "#2CA02C", "#3366CC")
AXIS_NAMES = ("X", "Y", "Z")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromosome", default="chr12")
    parser.add_argument("--time", default="12hrs")
    return parser.parse_args()


def fit_orientation(raw: np.ndarray, aligned: np.ndarray) -> np.ndarray:
    """Return the orthogonal orientation mapping raw row vectors to aligned."""
    source = raw - raw.mean(axis=0)
    target = aligned - aligned.mean(axis=0)
    affine = np.linalg.lstsq(source, target, rcond=None)[0]
    left, _, right_t = np.linalg.svd(affine)
    return left @ right_t


def draw_beads(ax, points: np.ndarray, color: str) -> None:
    ax.scatter(
        points[:, 0],
        points[:, 1],
        points[:, 2],
        s=8.5,
        color=color,
        alpha=0.72,
        edgecolors="white",
        linewidths=0.10,
        depthshade=True,
        zorder=2,
    )


def draw_triad(ax, origin, directions, length) -> None:
    """Draw unobtrusive axis lines above a structure, without arrowheads."""
    origin = np.asarray(origin, dtype=float)
    for name, color, direction in zip(AXIS_NAMES, AXIS_COLORS, directions):
        vector = np.asarray(direction, dtype=float) * length
        tip = origin + vector
        ax.plot(
            [origin[0], tip[0]],
            [origin[1], tip[1]],
            [origin[2], tip[2]],
            color=color,
            linewidth=2.4,
            solid_capstyle="round",
            zorder=12,
        )
        label_position = origin + vector * 1.12
        ax.text(
            *label_position,
            name,
            color=color,
            fontsize=9,
            fontweight="normal",
            ha="center",
            va="center",
            zorder=13,
        )


def clean_axis(ax, limits) -> None:
    ax.set_xlim(limits[0])
    ax.set_ylim(limits[1])
    ax.set_zlim(limits[2])
    ax.set_box_aspect((1, 1, 1), zoom=1.55)
    ax.view_init(elev=21, azim=-58)
    ax.set_axis_off()


def main() -> None:
    args = parse_args()
    chromosome = args.chromosome
    time = args.time
    raw: dict[str, np.ndarray] = {}
    aligned: dict[str, np.ndarray] = {}
    orientations: dict[str, np.ndarray] = {}
    sources: list[str] = []

    for condition, _, _ in CONDITIONS:
        raw_path = (
            DATA_ROOT
            / "all_structure_files"
            / chromosome
            / time
            / condition
            / f"structure_{time}_{condition}_with_id0.csv"
        )
        aligned_path = (
            DATA_ROOT
            / "structure_beads_aligned"
            / chromosome
            / f"{chromosome}_{time}_{condition}_aligned.json"
        )
        raw[condition] = load_raw(raw_path)
        aligned[condition] = load_aligned(aligned_path)
        orientations[condition] = fit_orientation(raw[condition], aligned[condition])
        sources.extend((str(raw_path), str(aligned_path)))

    plt.rcParams.update({"font.family": "DejaVu Sans", "figure.dpi": 160})
    fig = plt.figure(figsize=(8.0, 7.2), facecolor="white")
    panel_positions = (
        ((0.07, 0.48, 0.43, 0.39), (0.50, 0.48, 0.43, 0.39)),
        ((0.07, 0.075, 0.43, 0.39), (0.50, 0.075, 0.43, 0.39)),
    )

    for column, (condition, title, bead_color) in enumerate(CONDITIONS):
        for row, points in enumerate((raw[condition], aligned[condition])):
            ax = fig.add_axes(panel_positions[row][column], projection="3d")
            directions = np.eye(3) if row == 0 else orientations[condition]
            limits = equal_limits([points], padding=0.30)
            clean_axis(ax, limits)
            draw_beads(ax, points, bead_color)
            span = limits[0][1] - limits[0][0]
            triad_origin = points.mean(axis=0)
            draw_triad(ax, triad_origin, directions, span * 0.09)
            if row == 0:
                short_title = "UNTR" if condition == "untr" else "VACV"
                ax.set_title(
                    short_title,
                    color=bead_color,
                    fontsize=13,
                    fontweight="normal",
                    pad=0,
                )

    fig.suptitle(
        f"{chromosome.replace('chr', 'Chromosome ')}, {time}",
        fontsize=16,
        fontweight="normal",
        y=0.975,
    )
    fig.text(
        0.025,
        0.675,
        "Before alignment",
        rotation=90,
        ha="center",
        va="center",
        fontsize=10,
        fontweight="normal",
    )
    fig.text(
        0.025,
        0.275,
        "After alignment",
        rotation=90,
        ha="center",
        va="center",
        fontsize=10,
        fontweight="normal",
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stem = OUTPUT_DIR / f"{chromosome}_{time}_alignment_axis_triads"
    for extension in ("png", "svg", "pdf"):
        output = stem.with_suffix(f".{extension}")
        fig.savefig(output, dpi=320, facecolor="white", bbox_inches=None)
        print(f"Saved {output}")
    plt.close(fig)

    report = {
        "chromosome": chromosome,
        "time": time,
        "axis_colors": {"X": AXIS_COLORS[0], "Y": AXIS_COLORS[1], "Z": AXIS_COLORS[2]},
        "orientation_rows_in_aligned_xyz": {
            condition: orientation.tolist()
            for condition, orientation in orientations.items()
        },
        "sources": sources,
    }
    report_path = stem.with_name(stem.name + "_transform.json")
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"Saved {report_path}")


if __name__ == "__main__":
    main()
