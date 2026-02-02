
const fs = require('fs');
const path = require('path');

const indexHtmlPath = '/home/usic/.gemini/antigravity/scratch/Velveto-Team/Kaspi-Dashboard/public/vittorio/index.html';
let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

// Replace absolute paths with relative paths
// Handle src="/..."
htmlContent = htmlContent.replace(/src="\//g, 'src="./');
// Handle href="/..." but exclude external links (starting with //) and specific anchors if needed
// We need to be careful with href="/" (homepage) and href="/products" etc.
htmlContent = htmlContent.replace(/href="\/"/g, 'href="./index.html"');
htmlContent = htmlContent.replace(/href="\/products"/g, 'href="./products.html"');
htmlContent = htmlContent.replace(/href="\/contacts"/g, 'href="./contacts.html"');
htmlContent = htmlContent.replace(/href="\/page\/policy"/g, 'href="./page/policy.html"');
htmlContent = htmlContent.replace(/href="\/page\/dostavka-i-oplata"/g, 'href="./page/dostavka-i-oplata.html"');
htmlContent = htmlContent.replace(/href="\/page\/publichnaya-oferta"/g, 'href="./page/publichnaya-oferta.html"');

// Handle generic href="/..." for assets (css, etc)
// We use a regex that looks for href="/..." where ... doesn't start with / (to avoid //)
htmlContent = htmlContent.replace(/href="\/([^/])/g, 'href="./$1');

// Handle srcset="/..."
htmlContent = htmlContent.replace(/srcset="\//g, 'srcset="./');
// Handle comma-separated srcset
htmlContent = htmlContent.replace(/, \//g, ', ./');

// Handle poster="/..."
htmlContent = htmlContent.replace(/poster="\//g, 'poster="./');

// Handle specific product links
// href="/products/legend-no-1101" -> href="./products/legend-no-1101.html"
htmlContent = htmlContent.replace(/href="\/products\/([^"]+)"/g, (match, p1) => {
    if (p1.includes('.')) return match; // already has extension?
    return `href="./products/${p1}.html"`;
});

// Handle "url('/...')" in inline styles if any
htmlContent = htmlContent.replace(/url\('\//g, "url('./");
htmlContent = htmlContent.replace(/url\("\//g, 'url("./');

fs.writeFileSync(indexHtmlPath, htmlContent);
console.log('Fixed paths in index.html');
