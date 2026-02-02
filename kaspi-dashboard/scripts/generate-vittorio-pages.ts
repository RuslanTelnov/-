
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.resolve('public/vittorio/products.html');
const TEMPLATE_FILE = path.resolve('public/vittorio/product-template.html');
const OUTPUT_DIR = path.resolve('public/vittorio/products');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generatePages() {
    const productsHtml = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    const templateHtml = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

    const parts = productsHtml.split('<article class="preview-card"');
    console.log(`Found ${parts.length - 1} potential product cards.`);

    let updatedProductsHtml = productsHtml;
    let generatedCount = 0;

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];

        // Debug first part
        if (i === 1) {
            console.log(`Part 1 length: ${part.length}`);
            const hasTitleClass = part.includes('class="preview-card__title"');
            console.log(`Has title class: ${hasTitleClass}`);
        }

        // Regex to find link with specific class
        // We look for <a ... href="..." ... class="preview-card__title">
        // OR <a ... class="preview-card__title" ... href="...">

        // Try matching the specific anchor tag
        // match <a followed by anything until class="preview-card__title"
        // capturing href along the way

        let originalHref = '';

        // Strategy: Find the substring that contains the class, then extract href from it.
        // This avoids complex regex issues with order.

        const titleLinkMatch = part.match(/<a [^>]*class="preview-card__title"[^>]*>/);
        if (titleLinkMatch) {
            const tag = titleLinkMatch[0];
            const hrefMatch = tag.match(/href="([^"]+)"/);
            if (hrefMatch) {
                originalHref = hrefMatch[1];
            }
        }

        if (!originalHref) {
            // Try alternative order or just find the first href in the part (risky but maybe okay for this structure)
            // The first link in the card is usually the image slider or title.
            // In the file: <a href="..." class="preview-card__slider ..."> then <a href="..." class="preview-card__title">
            // Both point to the same product usually.

            // Let's try to find ANY href in the part if the specific one failed
            // But we prefer the title one.

            // If the tag match failed, maybe the class is not in the same line or something?
            // But we saw it in the file.

            if (i === 1) console.log('Failed to extract href from title link.');
            continue;
        }

        // Extract Title
        const titleMatch = part.match(/class="preview-card__title"[^>]*>.*?<span>(.*?)<\/span>/s) || part.match(/class="preview-card__title"[^>]*>.*?([^\s<]+).*?<\/a>/s);
        const title = titleMatch ? titleMatch[1].trim() : 'Product';

        // Extract Image
        const imgMatch = part.match(/<img[^>]+src="([^"]+)"/);
        const imageUrl = imgMatch ? imgMatch[1] : '';

        // Extract Price
        const priceMatch = part.match(/class="preview-card__price[^"]*">([^<]+)</);
        const price = priceMatch ? priceMatch[1].trim() : '';

        // Extract Group
        const groupMatch = part.match(/class="preview-card__value[^"]*">([^<]+)</);
        const description = groupMatch ? `Группа аромата: ${groupMatch[1].trim()}` : '';

        if (originalHref) {
            const slug = originalHref.split('/').pop();
            const filename = `${slug}.html`;
            const newHref = `/vittorio/products/${filename}`;

            // Generate Page
            let pageContent = templateHtml
                .replace(/{{TITLE}}/g, title)
                .replace(/{{IMAGE_URL}}/g, imageUrl)
                .replace(/{{PRICE}}/g, price)
                .replace(/{{DESCRIPTION}}/g, description);

            fs.writeFileSync(path.join(OUTPUT_DIR, filename), pageContent);
            generatedCount++;

            // Update Link in Index
            // Replace all instances of this href to be safe (image link and title link usually match)
            updatedProductsHtml = updatedProductsHtml.split(`"${originalHref}"`).join(`"${newHref}"`);
        }
    }

    fs.writeFileSync(PRODUCTS_FILE, updatedProductsHtml);
    console.log(`Generated ${generatedCount} pages.`);
    console.log('Updated products.html with new links.');
}

generatePages().catch(console.error);
