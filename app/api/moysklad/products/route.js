import { NextResponse } from 'next/server';

export async function GET(request) {
    const login = process.env.MOYSKLAD_LOGIN;
    const password = process.env.MOYSKLAD_PASSWORD;

    if (!login || !password) {
        return NextResponse.json({ error: 'MoySklad credentials missing' }, { status: 500 });
    }

    const auth = Buffer.from(`${login}:${password}`).toString('base64');

    try {
        console.log('[Products API] Calling MoySklad...');
        // Match the working pattern from search API
        const url = `https://api.moysklad.ru/api/remap/1.2/entity/product?limit=50&offset=0&expand=images`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Products API] MoySklad error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`MoySklad API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.rows) {
            return NextResponse.json({ products: [] });
        }

        const products = data.rows.map(product => {
            let imageUrl = null;
            if (product.images && product.images.rows && product.images.rows.length > 0) {
                imageUrl = product.images.rows[0].meta.downloadHref;
            }

            return {
                id: product.id,
                name: product.name,
                article: product.article,
                code: product.code,
                imageUrl: imageUrl
            };
        });

        return NextResponse.json({ products });

    } catch (error) {
        console.error('Fetch products error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
