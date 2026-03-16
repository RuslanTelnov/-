const fs = require('fs');
const THREE = require('three');
const { STLLoader } = require('three-stdlib');
const { GLTFExporter } = require('three/addons/exporters/GLTFExporter.js');
const { Blob, FileReader } = require('vblob');

// Patch globals for three.js exporters
global.Blob = Blob;
global.FileReader = FileReader;
global.window = {};

const loader = new STLLoader();
const stlBinary = fs.readFileSync('public/assets/models/astana.stl');
const geometry = loader.parse(stlBinary.buffer);

const material = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
const mesh = new THREE.Mesh(geometry, material);

// Apply similar transformations as in React to bake them into the GLB
mesh.rotation.x = -Math.PI / 2;
mesh.scale.set(0.1, 0.1, 0.1);
mesh.updateMatrixWorld(true);

const exporter = new GLTFExporter();
exporter.parse(
    mesh,
    (gltf) => {
        const buffer = Buffer.from(gltf);
        fs.writeFileSync('public/assets/models/astana.glb', buffer);
        console.log('Successfully saved GLB');
    },
    (err) => {
        console.error(err);
    },
    { binary: true } // GLB
);
