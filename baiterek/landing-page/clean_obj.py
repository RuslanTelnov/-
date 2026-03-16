import open3d as o3d

print("Loading OBJ...")
mesh = o3d.io.read_triangle_mesh('public/assets/models/astana_sim.obj')
print(f"Loaded vertices: {len(mesh.vertices)}")
mesh = mesh.remove_unreferenced_vertices()
print(f"Cleaned vertices: {len(mesh.vertices)}")
o3d.io.write_triangle_mesh('public/assets/models/astana_clean.obj', mesh)
print("Saved clean OBJ")
