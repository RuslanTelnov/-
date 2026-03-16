import sys
import subprocess

try:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--break-system-packages", "trimesh", "scipy"])
except Exception as e:
    print(f"Failed to install trimesh: {e}")
    sys.exit(1)

import trimesh

mesh = trimesh.load('public/assets/models/astana.stl')
# Export as binary GLB formats (much smaller and faster to load)
mesh.export('public/assets/models/astana.glb')
print("Successfully generated GLB")
