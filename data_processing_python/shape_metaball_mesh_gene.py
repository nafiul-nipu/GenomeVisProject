import os
import numpy as np
import pandas as pd
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes
import trimesh
from sklearn.neighbors import NearestNeighbors

# ---- Load Gene Positions from CSV ----
def load_gene_positions(csv_path):
    df = pd.read_csv(csv_path)
    return df[['middle_x', 'middle_y', 'middle_z']].dropna().values

# ---- Radius Estimation ----
def estimate_radius_nnd(points, scale=1.5):
    nbrs = NearestNeighbors(n_neighbors=2).fit(points)
    distances, _ = nbrs.kneighbors(points)
    avg_dist = np.mean(distances[:, 1])
    return avg_dist * scale

# ---- Create Metaball Field ----
def create_metaball_field(points, grid_resolution=150, radius=5.0, grid_margin=10):
    mins = points.min(axis=0) - grid_margin
    maxs = points.max(axis=0) + grid_margin
    dims = (maxs - mins)

    x = np.linspace(mins[0], maxs[0], grid_resolution)
    y = np.linspace(mins[1], maxs[1], grid_resolution)
    z = np.linspace(mins[2], maxs[2], grid_resolution)
    X, Y, Z = np.meshgrid(x, y, z, indexing='ij')
    field = np.zeros_like(X)

    for p in points:
        d2 = (X - p[0])**2 + (Y - p[1])**2 + (Z - p[2])**2
        field += np.exp(-d2 / (2 * radius**2))

    return field, (x, y, z)

# --- automatically detect marching cube level ---
def auto_select_level(field, grid_axes, level_range=(0.3, 0.7), steps=10):
    best_level = None
    best_score = -np.inf

    levels = np.linspace(level_range[0], level_range[1], steps)

    for lvl in levels:
        try:
            verts, faces, _, _ = marching_cubes(field, level=lvl)
            surface_area = trimesh.Trimesh(vertices=verts, faces=faces).area
            score = -abs(surface_area - 10000)  # target surface area (you can tune this)
            if score > best_score:
                best_score = score
                best_level = lvl
        except Exception:
            continue

    return best_level

# ---- Extract Surface from Scalar Field ----
def extract_metaball_surface(field, grid_axes, level=0.5):
    verts, faces, _, _ = marching_cubes(field, level=level)
    spacing = [(a[1] - a[0]) for a in grid_axes]
    origin = [a[0] for a in grid_axes]
    verts_world = verts * spacing + origin
    return trimesh.Trimesh(vertices=verts_world, faces=faces, process=False)

# ---- Visualize Just the Metaball Mesh ----
def view_metaball_with_points(mesh, points):
    scene = trimesh.Scene()

    # Make mesh bright and semi-transparent
    mesh.visual.face_colors = [200, 30, 30, 80]  # bright orange, semi-transparent
    mesh.fix_normals()
    scene.add_geometry(mesh)

    # Add spheres for genes in light gray
    for pt in points:
        sphere = trimesh.creation.icosphere(radius=0.25, subdivisions=2)
        sphere.apply_translation(pt)
        sphere.visual.vertex_colors = [180, 180, 180, 255]  # light gray
        scene.add_geometry(sphere)

    # Light settings
    scene.ambient_light = [1.0, 1.0, 1.0, 1.0]

    scene.show()


# ---- Main Pipeline ----
def run_metaball_pipeline(csv_path, save_path=None):
    points = load_gene_positions(csv_path)
    radius = estimate_radius_nnd(points, scale=1.5)
    print(f"Using radius: {radius:.3f}")

    field, axes = create_metaball_field(points, grid_resolution=150, radius=radius)
    level = auto_select_level(field, axes)
    print(f"Level selected: {level}")
    mesh = extract_metaball_surface(field, axes, level=0.5)

    if save_path:
        ext = os.path.splitext(save_path)[-1].replace('.', '')
        mesh.export(save_path, file_type=ext)
        print(f"Saved mesh to {save_path}")

    view_metaball_with_points(mesh, points)

# ---- Run Here ----
if __name__ == "__main__":
    csv_path = "data/green_monkey/all_structure_files/chr1/24hrs/vacv/structure_24hrs_vacv_gene_info.csv"
    obj_path = "data/green_monkey/all_structure_files/chr1/spatial_data/chr1_24hrs_vacv_metaball.obj"
    run_metaball_pipeline(csv_path, save_path=obj_path)
