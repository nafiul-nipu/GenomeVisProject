# mpase/__init__.py
"""
# MultiPointAlignmentShapeExtractor (MPASE)

**MultiPointAlignmentShapeExtractor (MPASE) is a 
pipeline for aligning multiple 3D point clouds, extracting density- and fraction-based shapes, and generating comparable visual and data outputs.
"""

# __init__.py  (package root, e.g., mpase/__init__.py)

__version__ = "0.1.0"

# ---- Public configs & types ----
from .types import (
    CfgCommon, CfgHDR, CfgPF, CfgMorph,
    Plane, Variant, ShapeProduct, RunResult,
)

# ---- Main entrypoint ----
from .main_run import run_silhouettes as run_silhouettes  # you can also alias to `run` below
run = run_silhouettes  # convenience alias

# ---- Visualization (user-facing) ----
from .visualization_save_image import (
    view, save_figures, view_projections, save_projections,
)

# ---- Data export (user-facing) ----
from .export_data_for_visd3three import export_all

# ---- Optional public helper ----
from .io_load import load_points

__all__ = [
    "__version__",
    # main
    "run_silhouettes", "run",
    # configs / types
    "CfgCommon", "CfgHDR", "CfgPF", "CfgMorph",
    "Plane", "Variant", "ShapeProduct", "RunResult",
    # viz
    "view", "save_figures", "view_projections", "save_projections",
    # exporters
    "export_all",
    # helper
    "load_points",
]