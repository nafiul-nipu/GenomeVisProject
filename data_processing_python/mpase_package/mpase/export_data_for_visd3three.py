import os
import re
import json
from pathlib import Path
from typing import Dict, Tuple, Iterable, Optional, List, Any, Callable
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
# + Progress / reporting + manifest

################# Helpers #################

def _ensure_dir(p: str):
    Path(p).mkdir(parents=True, exist_ok=True)


def _write_json(path: str, obj) -> str:
    """Write JSON and return the path (for manifest)."""
    with open(path, "w") as f:
        # Pretty for readability; small files remain fine, large files will still be large.
        json.dump(obj, f, separators=(",", ":"), allow_nan=False, indent=2)
    return path


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


def _notify(progress_report: bool, event: str, **payload):
    if progress_report:
        msg = f"[export] {event}"
        if payload:
            msg += ": " + ", ".join(f"{k}={v}" for k, v in payload.items() if k != "obj")
        print(msg)


################# Core #################

def export_meta(result: RunResult, out_dir: str, *, progress_report: bool = False, report: Optional[Callable] = None) -> List[str]:
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
        # NEW: Explicitly declare coordinate semantics for downstream tools.
        # Everything we write for 2D overlays (contours, projections) is in pixel space,
        # top-left origin, y-down to match SVG and skimage marching squares rasterization.
        coord_space="pixel",
        origin="top_left",
        y_down=True,
    )
    path = _write_json(os.path.join(out_dir, "meta_data.json"), meta)
    _notify(progress_report, "write", kind="meta", path=path)
    return [path]


################### D3: background-as-data ###################

def export_background_mask_json(result: RunResult, out_dir: str, *, progress_report: bool = False, report: Optional[Callable] = None) -> List[str]:
    _ensure_dir(out_dir)
    bg = {}
    for plane, arr in result["background"].items():
        # store as 0/1 (compact)
        bg[plane] = arr.astype(np.uint8).tolist()
    path = _write_json(os.path.join(out_dir, "background_mask.json"), bg)
    _notify(progress_report, "write", kind="background_mask", path=path)
    return [path]


################### D3: densities (per label) ###################

def export_density_json(result: RunResult, out_dir: str, which: Optional[Iterable[str]] = None, *, progress_report: bool = False, report: Optional[Callable] = None) -> List[str]:
    """
    Writes density fields as nested lists (floats) per label. Only if HDR was run.
    Output directory: <out_dir>/density/
    Files: <Label>_density.json (e.g., 12h_UNTR_density.json)
    """
    written: List[str] = []
    if not result.get("densities"):
        return written
    den_dir = os.path.join(out_dir, "density")
    _ensure_dir(den_dir)
    labels = list(which) if which is not None else list(result["densities"].keys())
    for lab in labels:
        if lab not in result["densities"]:
            continue
        payload = {plane: D.astype(float).tolist() for plane, D in result["densities"][lab].items()}
        fname = f"{_safe_name(lab)}_density.json"
        path = _write_json(os.path.join(den_dir, fname), payload)
        written.append(path)
        _notify(progress_report, "write", kind="density", label=str(lab), path=path)
    return written


################### D3: contours (pixel coords) ###################

def export_contours_d3(
    result: RunResult,
    out_dir: str,
    kind_levels: Dict[str, "int|Iterable[int]|str"] = {"hdr": "all", "point_fraction": "all"},
    *,
    progress_report: bool = False,
    report: Optional[Callable] = None,
) -> List[str]:
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
    written: List[str] = []
    # NEW: fix directory name to match the viewer and docstring ("contours", plural).
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
                    # pts = [[float(c[1]), float(c[0])] for c in C]
                    # Align contour coordinates to pixel centers
                    # Skimage find_contours returns coordinates in (row, col) with half-pixel offset.
                    # We subtract 0.5 so contours align with the same pixel centers used by projections.
                    pts = [[float(c[1]) - 0.5, float(c[0]) - 0.5] for c in C]
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
        # NEW: include lightweight meta for clarity (kept out of "contours" array to avoid breaking readers).
        payload = {
            "meta": {
                "coord_space": "pixel",
                "origin": "top_left",
                "y_down": True
            },
            "contours": entries
        }
        fname = f"{_safe_name(label)}_contour.json"
        path = _write_json(os.path.join(cont_dir, fname), payload)
        written.append(path)
        _notify(progress_report, "write", kind="contours", label=str(label), path=path, entries=len(entries))

    return written


################### D3: 2D projections (per plane) ###################

def export_projections_json(result: RunResult, out_dir: str, *, progress_report: bool = False, report: Optional[Callable] = None) -> List[str]:
    """
    Writes one file per plane under <out_dir>/projections/ in *pixel* grid coords that match contours:
      projections/<PLANE>_projections.json
      {"UNTR": [[x,y], ...], "VACV": [[x,y], ...], ...}

    Uses result["projections"][plane]["sets"][label] as 2D points.
    Pixel grid must match HDR/PF lattice: dims_by_plane + bbox_world.
    """
    written: List[str] = []
    proj_dir = os.path.join(out_dir, "projections")
    _ensure_dir(proj_dir)

    # Fallback grid sizes from background (nx, ny) = (width, height)
    grid = {plane: (bg.shape[1], bg.shape[0]) for plane, bg in result["background"].items()}

    for plane, d in result.get("projections", {}).items():
        if plane not in grid:
            continue

        # --- grid dims: prefer canonical dims saved with HDR/PF ---
        if "dims_by_plane" in result and plane in result["dims_by_plane"]:
            nx = int(result["dims_by_plane"][plane]["nx"])
            ny = int(result["dims_by_plane"][plane]["ny"])
        else:
            nx, ny = grid[plane]  # fallback from background masks

        sets2d = d.get("sets", {})
        if not sets2d:
            continue

        # --- canonical bbox from HDR/PF; no per-plane re-minmaxing when available ---
        bbox = (result.get("bbox_world", {}) or {}).get(plane)
        if bbox and all(k in bbox for k in ("xmin", "xmax", "ymin", "ymax")):
            xmin = float(bbox["xmin"]); xmax = float(bbox["xmax"])
            ymin = float(bbox["ymin"]); ymax = float(bbox["ymax"])
        else:
            # Fallback (should not happen if FIX 2 ran): derive bbox from all points + padding
            all_xy = []
            for P2 in sets2d.values():
                if P2 is None:
                    continue
                A = np.asarray(P2, dtype=float)
                if A.size == 0:
                    continue
                all_xy.append(A)
            if not all_xy:
                continue
            ALL = np.vstack(all_xy)
            raw_xmin, raw_xmax = float(np.min(ALL[:, 0])), float(np.max(ALL[:, 0]))
            raw_ymin, raw_ymax = float(np.min(ALL[:, 1])), float(np.max(ALL[:, 1]))
            xrng = max(1e-9, raw_xmax - raw_xmin)
            yrng = max(1e-9, raw_ymax - raw_ymin)
            pad_frac = float((result.get("pad_frac_by_plane", {}) or {}).get(plane, 0.05))
            xmin = raw_xmin - pad_frac * xrng; xmax = raw_xmax + pad_frac * xrng
            ymin = raw_ymin - pad_frac * yrng; ymax = raw_ymax + pad_frac * yrng

        # --- pad_frac for debug print: pull from result regardless of bbox path ---
        pad_frac = float((result.get("pad_frac_by_plane", {}) or {}).get(plane, 0.05))

        # guard against degenerate bbox
        if xmax <= xmin:
            xmax = xmin + 1.0
        if ymax <= ymin:
            ymax = ymin + 1.0

        print(
            f"[export_projections_json] plane={plane} "
            f"bbox (padded/global): x[{xmin:.3f},{xmax:.3f}] y[{ymin:.3f},{ymax:.3f}] "
            f"-> grid ({nx},{ny}), pad_frac={pad_frac:.3f}"
        )

        # map world -> pixel centers [0..nx-1],[0..ny-1] with y-down
        def to_pixel_global(points: np.ndarray):
            if points.size == 0:
                return points.tolist()
            P = np.asarray(points, dtype=float).copy()
            P[:, 0] = (P[:, 0] - xmin) / (xmax - xmin) * (nx - 1)                # x right
            P[:, 1] = (1.0 - (P[:, 1] - ymin) / (ymax - ymin)) * (ny - 1)        # y-down
            P[:, 0] = np.clip(P[:, 0], 0.0, nx - 1.0)
            P[:, 1] = np.clip(P[:, 1], 0.0, ny - 1.0)
            return P.tolist()

        plane_out = {str(lab): to_pixel_global(np.asarray(P2, dtype=float))
                     for lab, P2 in sets2d.items()}

        fname = f"{_safe_name(plane)}_projections.json"
        path = _write_json(os.path.join(proj_dir, fname), plane_out)
        written.append(path)
        _notify(progress_report, "write", kind="projections", plane=str(plane),
                path=path, labels=len(plane_out))

    return written



############## Metrics ################

def export_metrics_json(result: RunResult, out_dir: str, *, progress_report: bool = False, report: Optional[Callable] = None) -> List[str]:
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
    path = _write_json(os.path.join(out_dir, "metrics_data.json"), rows)
    _notify(progress_report, "write", kind="metrics", path=path, rows=len(rows))
    return [path]


#################### Three.js: 3D points (per label) ###################

def export_points3d_json(result: RunResult, out_dir: str, *, progress_report: bool = False, report: Optional[Callable] = None) -> List[str]:
    """
    Writes one file per label under <out_dir>/points3d/:
    points3d/<Label>_points3d.json
      {"positions": [[x,y,z], ...]}

    Uses result["aligned_points"] (list aligned to result["labels"]).
    """
    written: List[str] = []
    pts_dir = os.path.join(out_dir, "points3d")
    _ensure_dir(pts_dir)
    labels = list(result.get("labels", []))
    aligned = list(result.get("aligned_points", []))

    for lab, X in zip(labels, aligned):
        payload = {"positions": np.asarray(X, dtype=float).tolist()}
        fname = f"{_safe_name(lab)}_points3d.json"
        path = _write_json(os.path.join(pts_dir, fname), payload)
        written.append(path)
        _notify(progress_report, "write", kind="points3d", label=str(lab), path=path, count=len(payload["positions"]))

    return written


################# Optional: scene layout and scales #################

def export_layout_json(out_dir: str, layout: Optional[Dict[str, Dict[str, list]]] = None, *, progress_report: bool = False, report: Optional[Callable] = None) -> List[str]:
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
    path = _write_json(os.path.join(out_dir, "layout.json"), layout)
    _notify(progress_report, "write", kind="layout", path=path)
    return [path]


def export_scales_json(result: RunResult, out_dir: str, *, progress_report: bool = False, report: Optional[Callable] = None) -> List[str]:
    """
    scales.json: bounding box across ALL aligned points.
    """
    _ensure_dir(out_dir)
    if not result.get("aligned_points"):
        path = _write_json(os.path.join(out_dir, "scales.json"), {"bbox": {"mins": [0, 0, 0], "maxs": [0, 0, 0]}})
        _notify(progress_report, "write", kind="scales", path=path)
        return [path]
    P = np.vstack([np.asarray(X) for X in result["aligned_points"] if X is not None and len(X) > 0])
    mins = P.min(axis=0).astype(float).tolist()
    maxs = P.max(axis=0).astype(float).tolist()
    path = _write_json(os.path.join(out_dir, "scales.json"), {"bbox": {"mins": mins, "maxs": maxs}})
    _notify(progress_report, "write", kind="scales", path=path, mins=mins, maxs=maxs)
    return [path]


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
    progress_report: bool = False,
) -> None:
    """
    Produces the full pure-data bundle for D3 + Three.js and writes a manifest file (manifest.json):
      - meta_data.json (root)
      - background_mask.json (root)
      - contours/<Label>_contour.json (per label)
      - (opt) density/<Label>_density.json (per label, if HDR available)
      - projections/<PLANE>_projections.json (per plane)
      - metrics_data.json (root)
      - points3d/<Label>_points3d.json (per label)
      - (opt) layout.json (root)
      - (opt) scales.json (root)

    New:
      - progress notifications via `progress_report` prints
      - writes manifest.json summarizing outputs
    """
    _ensure_dir(out_dir)
    _notify(progress_report, "begin", out_dir=out_dir)

    manifest: Dict[str, Any] = {"root": out_dir, "written": {}}

    def rec(name: str, paths: List[str]):
        manifest["written"].setdefault(name, []).extend(paths)

    rec("meta", export_meta(result, out_dir, progress_report=progress_report))
    rec("background", export_background_mask_json(result, out_dir, progress_report=progress_report))
    if include_density:
        rec("density", export_density_json(result, out_dir, which=which_density, progress_report=progress_report))
    rec("contours", export_contours_d3(result, out_dir, kind_levels=kind_levels, progress_report=progress_report))
    rec("projections", export_projections_json(result, out_dir, progress_report=progress_report))
    rec("metrics", export_metrics_json(result, out_dir, progress_report=progress_report))
    rec("points3d", export_points3d_json(result, out_dir, progress_report=progress_report))
    if export_layout:
        rec("layout", export_layout_json(out_dir, progress_report=progress_report))
    if export_scales:
        rec("scales", export_scales_json(result, out_dir, progress_report=progress_report))

    # Flat summary
    all_paths = [p for group in manifest["written"].values() for p in group]
    manifest["summary"] = {
        "files": len(all_paths),
        "bytes": int(sum(os.path.getsize(p) for p in all_paths if os.path.exists(p))),
    }

    # Write manifest to disk
    mpath = _write_json(os.path.join(out_dir, "manifest.json"), manifest)
    _notify(progress_report, "write", kind="manifest", path=mpath)

    _notify(progress_report, "done", files=manifest["summary"]["files"], bytes=manifest["summary"]["bytes"])
