
const fs = require('fs');
const path = require('path');

const indexHtmlPath = '/home/usic/.gemini/antigravity/scratch/Velveto-Team/Kaspi-Dashboard/public/vittorio/index.html';
let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

// Fix product links that were converted to ./products/... but missing .html
// Look for href="./products/..." where ... does not contain .html and is not just "products.html"
// We want to target sub-paths like ./products/legend-no-1101
htmlContent = htmlContent.replace(/href="\.\/products\/([^"]+)"/g, (match, p1) => {
    if (p1.endsWith('.html') || p1.includes('#') || p1 === '') return match;
    // Check if it's a query param
    if (p1.includes('?')) {
        const parts = p1.split('?');
        return `href="./products/${parts[0]}.html?${parts[1]}"`;
    }
    return `href="./products/${p1}.html"`;
});

fs.writeFileSync(indexHtmlPath, htmlContent);
console.log('Fixed product links in index.html');
