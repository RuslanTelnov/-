
// @ts-nocheck
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const indexHtmlPath = '/home/usic/.gemini/antigravity/scratch/Velveto-Team/Kaspi-Dashboard/public/vittorio/index.html';
const baseUrl = 'https://vittorio-parfum.ru';
const localBaseDir = '/home/usic/.gemini/antigravity/scratch/Velveto-Team/Kaspi-Dashboard/public/vittorio';

const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

// Regex to find src, href, srcset with absolute paths starting with /
const regex = /(?:src|href|srcset)="([^"]+)"/g;
const matches = new Set();

let match;
while ((match = regex.exec(htmlContent)) !== null) {
    const url = match[1];
    // We only want paths starting with / but not // (protocol relative)
    if (url.startsWith('/') && !url.startsWith('//')) {
        // Handle srcset which might have multiple urls and widths
        if (match[0].startsWith('srcset')) {
            const parts = url.split(',');
            parts.forEach(part => {
                const cleanUrl = part.trim().split(' ')[0];
                if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('//')) {
                    matches.add(cleanUrl);
                }
            });
        } else {
            matches.add(url);
        }
    }
}

// Also manually add the video file if not caught (it should be caught by src)
matches.add('/17sec.mp4');

console.log(`Found ${matches.size} assets to check/download.`);

const downloadFile = (urlPath) => {
    // Remove query parameters for local file path
    const cleanPath = urlPath.split('?')[0];
    const localPath = path.join(localBaseDir, cleanPath);
    const dir = path.dirname(localPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(localPath)) {
        // console.log(`Skipping existing: ${cleanPath}`);
        return;
    }

    console.log(`Downloading: ${urlPath} -> ${localPath}`);

    try {
        execSync(`curl -s -o "${localPath}" "${baseUrl}${urlPath}"`);
    } catch (e) {
        console.error(`Failed to download ${urlPath}: ${e}`);
    }
};

Array.from(matches).forEach(url => {
    downloadFile(url);
});
