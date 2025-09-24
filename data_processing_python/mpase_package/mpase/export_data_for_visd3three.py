import os
import re
import json
from pathlib import Path
from typing import Dict, Tuple, Iterable, Optional
import numpy as np

# Internal types and configs (from the main pipeline module)
from .types import RunResult, Plane, CfgHDR, CfgPF, ShapeProduct
from .visualization_save_image import _levels_from_result

##################### PURE-DATA EXPORTERS (D3 + THREE) #####################
# background mask
# contours (per-label files)
# densities (per-label files)
# projections (per-plane files)
# points3D (per-label files)
# scales (bbox, mins)
# meta_data.json
# layout
# metrics_data.json

################# Helpers #################

def _ensure_dir(p: str):
    Path(p).mkdir(parents=True, exist_ok=True)


def _write_json(path: str, obj):
    with open(path, "w") as f:
        # Pretty for readability; small files remain fine, large files will still be large.
        json.dump(obj, f, separators=(",", ":"), allow_nan=False, indent=2)


def _grid_sizes_from_result(result: RunResult) -> Dict[Plane, Tuple[int, int]]:
    # nx,ny from background masks (bool arrays are [ny, nx])
    return {plane: (bg.shape[1], bg.shape[0]) for plane, bg in result["background"].items()}


def _safe_name(s: str) -> str:
    """Make a filesystem-safe, compact filename from a label or plane name."""
    s = str(s).strip()
    # Replace spaces, slashes, and other non-word chars with underscore; collapse repeats.
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s)
    s = re.sub(r"_+", "_", s)
    return s.strip("._-") or "unnamed"

################# Core #################

def export_meta(result: RunResult, out_dir: str):
    """
    meta_data.json:
      {
        "planes": ["XY","YZ","XZ"],
        "grid": {"XY":[nx,ny], ...},
        "levels": {"hdr":[...], "pf":[...]},
        "labels": ["UNTR","VACV", ...]
      }
    """
    _ensure_dir(out_dir)
    planes = list(result["background"].keys())
    grid = {p: list(_grid_sizes_from_result(result)[p]) for p in planes}
    labels = list(result.get("labels", []))

    levels_hdr, levels_pf = set(), set()
    if "hdr" in result["shapes"]:
        for plane in result["shapes"]["hdr"].keys():
            levels_hdr.update(result["shapes"]["hdr"][plane].keys())
    if "point_fraction" in result["shapes"]:
        for plane in result["shapes"]["point_fraction"].keys():
            levels_pf.update(result["shapes"]["point_fraction"][plane].keys())

    meta = dict(
        planes=planes,
        grid=grid,
        levels={
            "hdr": sorted([int(x) for x in levels_hdr], reverse=True),
            "pf": sorted([int(x) for x in levels_pf], reverse=True),
        },
        labels=labels,
    )
    _write_json(os.path.join(out_dir, "meta_data.json"), meta)


################### D3: background-as-data ###################

def export_background_mask_json(result: RunResult, out_dir: str):
    _ensure_dir(out_dir)
    bg = {}
    for plane, arr in result["background"].items():
        # store as 0/1 (compact)
        bg[plane] = arr.astype(np.uint8).tolist()
    _write_json(os.path.join(out_dir, "background_mask.json"), bg)


################### D3: densities (per label) ###################

def export_density_json(result: RunResult, out_dir: str, which: Optional[Iterable[str]] = None):
    """
    Writes density fields as nested lists (floats) per label. Only if HDR was run.
    Output directory: <out_dir>/density/
    Files: <Label>_density.json (e.g., 12h_UNTR_density.json)
    """
    if not result.get("densities"):
        return
    den_dir = os.path.join(out_dir, "density")
    _ensure_dir(den_dir)
    labels = list(which) if which is not None else list(result["densities"].keys())
    for lab in labels:
        if lab not in result["densities"]:
            continue
        payload = {plane: D.astype(float).tolist() for plane, D in result["densities"][lab].items()}
        fname = f"{_safe_name(lab)}_density.json"
        _write_json(os.path.join(den_dir, fname), payload)


################### D3: contours (pixel coords) ###################

def export_contours_d3(
    result: RunResult,
    out_dir: str,
    kind_levels: Dict[str, "int|Iterable[int]|str"] = {"hdr": "all", "point_fraction": "all"},
):
    """
    Writes per-label contour bundles under <out_dir>/contours/.
    Each file aggregates that label's contours across planes and levels.

    contours/<Label>_contour.json
      {
        "contours": [
          {"plane": "XY", "variant": "hdr"|"pf", "level": 95, "label": "12h_UNTR", "points": [[x,y], ...]},
          ...
        ]
      }

    Reads from: result["shapes"][variant][plane][level][label] -> ShapeProduct
    """
    cont_dir = os.path.join(out_dir, "contours")
    _ensure_dir(cont_dir)

    # Build a map label -> list of contour entries
    per_label: Dict[str, list] = {}

    cfg_hdr = CfgHDR()
    cfg_pf = CfgPF()

    for kind, lv in kind_levels.items():
        if kind not in result["shapes"]:
            continue
        levels = _levels_from_result(kind, cfg_hdr, cfg_pf, lv)
        for plane, by_level in result["shapes"][kind].items():
            for level in levels:
                by_label = by_level.get(level)
                if not by_label:
                    continue
                for label, sp in by_label.items():
                    C = sp.get("contour")
                    if C is None:
                        continue
                    # skimage contours are [row(y), col(x)] — convert to [x,y]
                    pts = [[float(c[1]), float(c[0])] for c in C]
                    entry = dict(
                        plane=plane,
                        variant="hdr" if kind == "hdr" else "pf",
                        level=int(level),
                        label=str(label),
                        points=pts,
                    )
                    per_label.setdefault(str(label), []).append(entry)

    # Write one file per label
    for label, entries in per_label.items():
        fname = f"{_safe_name(label)}_contour.json"
        _write_json(os.path.join(cont_dir, fname), {"contours": entries})


################### D3: 2D projections (per plane) ###################

def export_projections_json(result: RunResult, out_dir: str):
    """
    Writes one file per plane under <out_dir>/projections/ in *pixel* grid coords that match contours:
    projections/<PLANE>_projections.json
      {"UNTR": [[x,y], ...], "VACV": [[x,y], ...], ...}

    Uses result["projections"][plane]["sets"][label] as 2D points.
    """
    proj_dir = os.path.join(out_dir, "projections")
    _ensure_dir(proj_dir)

    # grid sizes from background (to align with contour pixel space)
    grid = {plane: (bg.shape[1], bg.shape[0]) for plane, bg in result["background"].items()}  # (nx, ny)

    for plane, d in result.get("projections", {}).items():
        if plane not in grid:
            continue
        nx, ny = grid[plane]
        sets2d = d.get("sets", {})
        plane_out = {}

        def to_pixel(points: np.ndarray):
            if points.size == 0:
                return points.tolist()
            P = points.astype(float).copy()

            # If normalized 0..1 → scale to pixel grid
            if np.all((P >= 0) & (P <= 1)):
                P[:, 0] *= (nx - 1)
                P[:, 1] *= (ny - 1)

            # Flip Y to image coordinates (origin top-left)
            P[:, 1] = (ny - 1) - P[:, 1]
            return P.tolist()

        for lab, P2 in sets2d.items():
            plane_out[str(lab)] = to_pixel(np.asarray(P2))

        fname = f"{_safe_name(plane)}_projections.json"
        _write_json(os.path.join(proj_dir, fname), plane_out)


############## Metrics ################

def export_metrics_json(result: RunResult, out_dir: str):
    """
    metrics_data.json: list of rows; already pairwise (A,B) in your DataFrame.
    """
    _ensure_dir(out_dir)
    rows = result["metrics"].to_dict(orient="records")
    # ensure json-serializable types
    for r in rows:
        for k, v in list(r.items()):
            if isinstance(v, (np.floating, np.integer)):
                r[k] = float(v)
    _write_json(os.path.join(out_dir, "metrics_data.json"), rows)


#################### Three.js: 3D points (per label) ###################

def export_points3d_json(result: RunResult, out_dir: str):
    """
    Writes one file per label under <out_dir>/points3d/:
    points3d/<Label>_points3d.json
      {"positions": [[x,y,z], ...]}

    Uses result["aligned_points"] (list aligned to result["labels"]).
    """
    pts_dir = os.path.join(out_dir, "points3d")
    _ensure_dir(pts_dir)
    labels = list(result.get("labels", []))
    aligned = list(result.get("aligned_points", []))

    for lab, X in zip(labels, aligned):
        payload = {"positions": np.asarray(X, dtype=float).tolist()}
        fname = f"{_safe_name(lab)}_points3d.json"
        _write_json(os.path.join(pts_dir, fname), payload)


################# Optional: scene layout and scales #################

def export_layout_json(out_dir: str, layout: Optional[Dict[str, Dict[str, list]]] = None):
    """
    layout.json:
      { "XY":{"origin":[0,0,0],"normal":[0,0,1]}, ... }
    """
    _ensure_dir(out_dir)
    layout = layout or {
        "XY": {"origin": [0, 0, 0], "normal": [0, 0, 1]},
        "YZ": {"origin": [1.2, 0, 0], "normal": [1, 0, 0]},
        "XZ": {"origin": [0, -1.2, 0], "normal": [0, 1, 0]},
    }
    _write_json(os.path.join(out_dir, "layout.json"), layout)


def export_scales_json(result: RunResult, out_dir: str):
    """
    scales.json: bounding box across ALL aligned points.
    """
    _ensure_dir(out_dir)
    if not result.get("aligned_points"):
        _write_json(os.path.join(out_dir, "scales.json"), {"bbox": {"mins": [0, 0, 0], "maxs": [0, 0, 0]}})
        return
    P = np.vstack([np.asarray(X) for X in result["aligned_points"] if X is not None and len(X) > 0])
    mins = P.min(axis=0).astype(float).tolist()
    maxs = P.max(axis=0).astype(float).tolist()
    _write_json(os.path.join(out_dir, "scales.json"), {"bbox": {"mins": mins, "maxs": maxs}})


################ One-call convenience ################

def export_all(
    result: RunResult,
    out_dir: str = "web_data",
    *,
    include_density: bool = True,
    export_layout: bool = True,
    export_scales: bool = True,
    kind_levels: Dict[str, "int|Iterable[int]|str"] = {"hdr": "all", "point_fraction": "all"},
    which_density: Optional[Iterable[str]] = None,
):
    """
    Produces the full pure-data bundle for D3 + Three.js:
      - meta_data.json (root)
      - background_mask.json (root)
      - contours/<Label>_contour.json (per label)
      - (opt) density/<Label>_density.json (per label, if HDR available)
      - projections/<PLANE>_projections.json (per plane)
      - metrics_data.json (root)
      - points3d/<Label>_points3d.json (per label)
      - (opt) layout.json (root)
      - (opt) scales.json (root)
    """
    print("this is the new pipeline for extraction")
    _ensure_dir(out_dir)
    export_meta(result, out_dir)
    export_background_mask_json(result, out_dir)
    if include_density:
        export_density_json(result, out_dir, which=which_density)
    export_contours_d3(result, out_dir, kind_levels=kind_levels)
    export_projections_json(result, out_dir)
    export_metrics_json(result, out_dir)
    export_points3d_json(result, out_dir)
    if export_layout:
        export_layout_json(out_dir)
    if export_scales:
        export_scales_json(result, out_dir)
