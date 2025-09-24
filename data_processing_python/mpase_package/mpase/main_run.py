import os
import json
from typing import List, Dict, Tuple, Optional, Sequence, Literal
from dataclasses import asdict

import numpy as np
import pandas as pd

# Internal: bring in configs, types, and helper funcs from your other modules
from .types import CfgCommon, CfgHDR, CfgPF, Plane, Variant, ShapeProduct  # adjust path as needed
from .io_load import load_points
from .point_alignment import best_pca_prealign, icp_rigid_robust, _save_aligned_points
from .create_grid_planes import make_grid_from_bounds, grid_centers_from_edges, PLANE_FROM_AXIS, AXPAIR, rasterize_points
from .metrics_calculation import iou_bool, contour_distances
from .hdr_bootstrap import boot_density_2d, make_hdr_shape
from .point_fraction import make_pf_shape


# silhouette_analysis_hdr_point_frac.py
# Minimal, dependency-light core that runs HDR and/or PF given two CSVs + optional configs.

# imports
    
    
# ---------------------------- Orchestration ----------------------------
def _per_plane_sets(aligned: List[np.ndarray], edges3d, labels: List[str],
                    planes: Tuple[Plane, ...]) -> Tuple[Dict[Plane, Dict[str, object]], Dict[Plane, np.ndarray]]:
    """
    Build per-plane dict with 2D projections for EACH set and a union background.
    Returns:
      per_plane[plane] = {"xs": xs, "ys": ys, "sets": {label: points2d}}
      background[plane] = bool mask (union over all sets)
    """
    per_plane: Dict[Plane, Dict[str, object]] = {}
    background: Dict[Plane, np.ndarray] = {}

    # loop over three projections
    for a in ('x','y','z'):
        # which plane (e.g., 'z' → "XY", 'y' → "XZ", `'x' → "YZ"'
        plane: Plane = PLANE_FROM_AXIS[a]  # type: ignore
        if plane not in planes: 
            continue

        # which two axes to use (e.g., 'z' → (0,1) for X and Y)  
        # Needed to slice the point arrays correctly (A[:, [i, j]]).
        i, j = AXPAIR[a]
        # Pull out the grid edges along the chosen axes from the global 3D grid.
        #Ensures both conditions (A and B) rasterize onto the same pixel grid,
        # making IoU and distance metrics valid.
        ex, ey = edges3d[i], edges3d[j]
        xs, ys = grid_centers_from_edges(ex, ey)

        # 2D projections per set
        sets2d: Dict[str, np.ndarray] = {lab: X[:, [i, j]] for lab, X in zip(labels, aligned)}  # type: ignore
        per_plane[plane] = dict(xs=xs, ys=ys, sets=sets2d)

        # union-of-presence background
        # Background masks (for plotting if needed)
        # Quick union-of-presence mask per plane (A ∪ B), using simple disk splats
        # Purely for visual context layers in figures (light gray “cloud”)
        bg = None
        for lab in labels:
            cur = rasterize_points(sets2d[lab], xs, ys, disk_px=2)
            bg = cur if bg is None else (bg | cur)
        background[plane] = bg  # type: ignore

    return per_plane, background


# main function to run silhouette analysis
# accepts N CSVs or N point arrays (including the 2-set case)
# toggles HDR and PF computations
# returns a RunResult-like dict with per-set shapes and pairwise metrics
def mpase(csv_list: Optional[Sequence[str]] = None,
                    *,
                    points_list: Optional[Sequence[np.ndarray]] = None,
                    labels: Optional[Sequence[str]] = None,
                    xyz_cols: Tuple[str,str,str] = ("middle_x","middle_y","middle_z"),
                    out_dir: Optional[str] = None,
                    align_mode: Literal["auto","skip"]="auto",
                    point_alignment_only: bool = False,
                    run_hdr: bool = True,
                    run_pf: bool = True,
                    cfg_common: Optional[CfgCommon] = None,
                    cfg_hdr: Optional[CfgHDR] = None,
                    cfg_pf: Optional[CfgPF] = None,
                    planes: Tuple[Plane, ...] = ("XY","YZ","XZ")) -> dict:
    """
    Entrypoint (N-set): pass csv_list with xyz_cols OR pass points_list arrays.
    All sets are centered; if align_mode='auto', every set after the first is PCA-prealigned
    + ICP-refined to the first set (reference). A single global bbox scale and a shared 3D grid
    are used for all sets so projections and masks are comparable.

    Returns a dict with:
      - labels: List[str]
      - aligned_points: List[np.ndarray]           # each (Ni,3)
      - shapes: {variant->{plane->{level->{label->ShapeProduct}}}}
      - metrics: pd.DataFrame                      # pairwise rows across labels
      - meta: dict
      - background: {plane->bool mask}             # union-of-presence per plane
      - densities: Optional[{label->{plane->np.ndarray}}]  # HDR densities if run
      - projections: {plane:{'xs','ys','sets':{label->points2d}}}
    """
    # ---------------------------- Prepare configs & output dir ----------------------------
    cfg_common = cfg_common or CfgCommon()
    if out_dir: cfg_common.out_dir = out_dir
    cfg_hdr = cfg_hdr or CfgHDR()
    cfg_pf  = cfg_pf  or CfgPF()
    os.makedirs(cfg_common.out_dir, exist_ok=True)

    # ---------------------------- Load & basic checks ----------------------------
    if points_list is not None:
        raw_sets = [np.asarray(P, dtype=np.float32) for P in points_list]
        labels   = list(labels) if labels else [f"S{i}" for i in range(len(raw_sets))]
        sources  = labels[:]  # informational
    elif csv_list:
        raw_sets = [load_points(p, cols=xyz_cols) for p in csv_list]
        labels   = list(labels) if labels else [os.path.splitext(os.path.basename(p))[0] for p in csv_list]
        sources  = list(csv_list)
    else:
        raise ValueError("Provide csv_list OR points_list.")
    if len(raw_sets) < 2:
        raise ValueError("Need at least 2 point sets for comparison.")

    # ---------------------------- Alignment (center → optional PCA+ICP to ref) ----------------------------
    # Reference is the first set (index 0)
    ref = raw_sets[0] - raw_sets[0].mean(0)
    aligned: List[np.ndarray] = []

    for idx, R in enumerate(raw_sets):
        # center at origin
        R0 = R - R.mean(0)

        if idx == 0 or align_mode == "skip":
            # reference or skip-mode: no cross-alignment
            X = R0
        else:
            # best-PCA prealignment, then robust ICP to the reference
            Rpre = best_pca_prealign(R0, ref)
            R1   = R0 @ Rpre.T
            Ricp, ticp = icp_rigid_robust(ref, R1,
                                          iters=cfg_common.icp_iters,
                                          sample=cfg_common.sample_icp,
                                          trim_q=cfg_common.trim_q)
            X = (R1 @ Ricp.T + ticp)
        aligned.append(X)

    # ---------------------------- Global uniform scale + shared 3D grid ----------------------------
    # Compute single bbox over ALL aligned sets, scale each to that bbox,
    # then create one shared 3D grid for consistent 2D edges.
    mins = np.vstack(aligned).min(0)
    maxs = np.vstack(aligned).max(0)
    s = float((maxs - mins).max() + 1e-8)
    aligned = [X / s for X in aligned]

    edges3d, _ = make_grid_from_bounds(np.vstack(aligned),
                                       base=cfg_common.grid_base,
                                       pad_frac=cfg_common.pad_frac)

    # ---------------------------- Per-plane projections & background ----------------------------
    # Typical contents: {plane: {"xs","ys","sets":{label->points2d}}}
    # Background is union-of-presence per plane (for light gray plot layer)
    per_plane, background = _per_plane_sets(aligned, edges3d, labels, planes)

    # ---------------------------- Alignment-only early return ----------------------------
    if point_alignment_only or (not run_hdr and not run_pf):
        # Optional: save aligned coordinates for users who just want the transform outputs
        _save_aligned_points(aligned, labels, cfg_common.out_dir)

        # Minimal meta receipt
        meta = dict(
            sources=list(sources),
            labels=list(labels),
            cfg_common=asdict(cfg_common),
            cfg_hdr=None,
            cfg_pf=None,
            planes=list(per_plane.keys()),
            align_mode=align_mode,
            note="Alignment-only run (no HDR/PF/metrics)."
        )
        with open(os.path.join(cfg_common.out_dir, "meta_data.json"), "w") as f:
            json.dump(meta, f, indent=2)

        # Return a lightweight result object, shapes empty, metrics empty
        return dict(
            labels=list(labels),
            aligned_points=aligned,
            shapes={},
            metrics=pd.DataFrame(columns=["plane","mode","level","A","B","IoU","meanNN","Hausdorff"]),
            meta=meta,
            background=background,
            densities=None,
            projections=per_plane,
        )

    # ---------------------------- HDR density compute (optional) ----------------------------
    densities: Optional[Dict[str, Dict[Plane, np.ndarray]]] = None
    if run_hdr:
        densities = {lab: {} for lab in labels}
        # Build smoothed bootstrap-averaged density maps per set, per plane
        for a in ('x','y','z'):
            plane: Plane = PLANE_FROM_AXIS[a]  # type: ignore
            if plane not in planes: 
                continue
            for lab, X in zip(labels, aligned):
                D = boot_density_2d(X, edges3d,
                                    n_boot=cfg_hdr.n_boot,
                                    sample_frac=cfg_hdr.sample_frac,
                                    sigma_px=cfg_hdr.sigma_px,
                                    rng_seed=cfg_hdr.rng_seed)
                densities[lab][plane] = D[a]  # store [ny,nx] density for this plane

    # ---------------------------- Build shapes + pairwise metrics ----------------------------
    # shapes: variant -> plane -> level -> { label -> ShapeProduct }
    shapes: Dict[Variant, Dict[Plane, Dict[int, Dict[str, ShapeProduct]]]] = {}
    rows: List[dict] = []

    # HDR shapes: extract contour/mask at mass levels for each set; then pairwise metrics
    if run_hdr and densities is not None:
        shapes.setdefault("hdr", {})
        for plane in per_plane.keys():
            shapes["hdr"].setdefault(plane, {})
            for m in cfg_hdr.mass_levels:
                level = int(round(m * 100))
                shapes["hdr"][plane].setdefault(level, {})

                # Per-set HDR shape for this plane/level
                for lab in labels:
                    D = densities[lab][plane]
                    if D is None: 
                        continue
                    sp = make_hdr_shape(D, plane, m, cfg_hdr.density_floor_frac)
                    shapes["hdr"][plane][level][lab] = sp

                # Pairwise metrics between all sets (IoU, meanNN, Hausdorff)
                for i in range(len(labels)):
                    for j in range(i+1, len(labels)):
                        A_lab, B_lab = labels[i], labels[j]
                        A_sp = shapes["hdr"][plane][level].get(A_lab)
                        B_sp = shapes["hdr"][plane][level].get(B_lab)
                        if not A_sp or not B_sp:
                            continue
                        # calls iou_bool to compute Intersection-over-Union (IoU) for the two boolean masks
                        IoU = iou_bool(A_sp["mask"], B_sp["mask"])
                         # calls contour_distances to compute mean nearest neighbor and Hausdorff distances between the two contours
                        mnn, haus = contour_distances(A_sp["contour"], B_sp["contour"])
                        # append a dict with all info to rows
                        rows.append(dict(mode="hdr", plane=plane, level=level,
                                         A=A_lab, B=B_lab, IoU=IoU, meanNN=mnn, Hausdorff=haus))

    # Point-Fraction shapes: densest fraction per set; then pairwise metrics
    if run_pf:
        shapes.setdefault("point_fraction", {})
        for plane, d in per_plane.items():
            xs = d["xs"]  # pixel centers along X
            ys = d["ys"]  # pixel centers along Y
            sets2d: Dict[str, np.ndarray] = d["sets"]  # label -> 2D points
            for frac in cfg_pf.frac_levels:
                level = int(round(frac * 100))
                shapes["point_fraction"].setdefault(plane, {})
                shapes["point_fraction"][plane].setdefault(level, {})

                # Per-set PF shape for this plane/level
                for lab, P2 in sets2d.items():
                    sp = make_pf_shape(P2, xs, ys, plane, frac,
                                       cfg_pf.bandwidth, cfg_pf.disk_px, morph=cfg_pf.morph)
                    shapes["point_fraction"][plane][level][lab] = sp

                # Pairwise metrics between all sets
                for i in range(len(labels)):
                    for j in range(i+1, len(labels)):
                        A_lab, B_lab = labels[i], labels[j]
                        A_sp = shapes["point_fraction"][plane][level].get(A_lab)
                        B_sp = shapes["point_fraction"][plane][level].get(B_lab)
                        if not A_sp or not B_sp:
                            continue
                        # calls iou_bool to compute Intersection-over-Union (IoU) for the two boolean masks
                        IoU = iou_bool(A_sp["mask"], B_sp["mask"])
                        # calls contour_distances to compute mean nearest neighbor and Hausdorff distances between the two contours
                        mnn, haus = contour_distances(A_sp["contour"], B_sp["contour"])
                        # append a dict with all info to rows
                        rows.append(dict(mode="point_fraction", plane=plane, level=level,
                                         A=A_lab, B=B_lab, IoU=IoU, meanNN=mnn, Hausdorff=haus))

    # ---------------------------- Metrics + meta ----------------------------
    # compile metrics into a DataFrame and save as CSV
    metrics = pd.DataFrame(rows).sort_values(
        ["plane", "mode", "level", "A", "B"],
        ascending=[True, True, False, True, True]
    )
    metrics_path = os.path.join(cfg_common.out_dir, "metrics_data.csv")
    metrics.to_csv(metrics_path, index=False)

    # save a JSON receipt with input files, configs, and planes processed
    meta = dict(
        sources=list(sources),
        labels=list(labels),
        cfg_common=asdict(cfg_common), cfg_hdr=asdict(cfg_hdr), cfg_pf=asdict(cfg_pf),
        planes=list(per_plane.keys()),
        align_mode=align_mode
    )
    with open(os.path.join(cfg_common.out_dir, "meta_data.json"), "w") as f:
        json.dump(meta, f, indent=2)

    # ---------------------------- Return ----------------------------
    return dict(
        labels=list(labels),
        aligned_points=aligned,
        shapes=shapes,
        metrics=metrics,
        meta=meta,
        background=background,
        densities=densities,
        projections=per_plane,
    )
