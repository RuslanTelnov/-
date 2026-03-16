import sys
import subprocess
import os

try:
    import open3d as o3d
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--break-system-packages", "open3d"])
    import open3d as o3d

print("Loading mesh...")
in_file = 'public/assets/models/astana.stl'
out_file = 'public/assets/models/astana.gltf' # Open3D can export GLTF or OBJ

mesh = o3d.io.read_triangle_mesh(in_file)
print(f"Original vertices: {len(mesh.vertices)}")
print(f"Original triangles: {len(mesh.triangles)}")

# Decimate to 5% of original triangles
target_triangles = max(int(len(mesh.triangles) * 0.05), 10000)
print(f"Decimating to {target_triangles} triangles...")

mesh_smp = mesh.simplify_quadric_decimation(target_number_of_triangles=target_triangles)
print(f"Simplified vertices: {len(mesh_smp.vertices)}")
print(f"Simplified triangles: {len(mesh_smp.triangles)}")

mesh_smp.compute_vertex_normals()

# Open3D supports exporting to obj, ply, stl. Exporting to GLTF directly might not be supported in older versions, but obj is safe.
temp_obj = 'public/assets/models/astana_sim.obj'
print(f"Saving to {temp_obj}...")
o3d.io.write_triangle_mesh(temp_obj, mesh_smp)
print("Saved.")
