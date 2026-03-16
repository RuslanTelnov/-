import open3d as o3d
import sys

print("Loading GLB...")
in_file = 'public/assets/models/astana.glb'
out_file = 'public/assets/models/astana_sim.obj'

mesh = o3d.io.read_triangle_mesh(in_file)
print(f"Original vertices: {len(mesh.vertices)}")
print(f"Original triangles: {len(mesh.triangles)}")

# Decimate to 5% of original triangles
target_triangles = max(int(len(mesh.triangles) * 0.05), 10000)
print(f"Decimating to {target_triangles} triangles...")

mesh_smp = mesh.simplify_quadric_decimation(target_number_of_triangles=target_triangles)
mesh_smp.compute_vertex_normals()
print(f"Simplified vertices: {len(mesh_smp.vertices)}")
print(f"Simplified triangles: {len(mesh_smp.triangles)}")

print(f"Saving to {out_file}...")
o3d.io.write_triangle_mesh(out_file, mesh_smp)
print("Saved.")
