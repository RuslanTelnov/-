const fs = require('fs');
const model = JSON.parse(fs.readFileSync('public/assets/models/astana.glb', 'utf-8').split('JSON')[1] || '{}'); // Quick hack to check materials if it's gltf json embedded
// Better to just print the size
