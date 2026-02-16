import { NextResponse } from 'next/server';

export async function GET(request) {
    const login = process.env.MOYSKLAD_LOGIN;
    const password = process.env.MOYSKLAD_PASSWORD;
    const auth = Buffer.from(`${login}:${password}`).toString('base64');

    try {
        // Fetch 50 recent products with images expanded
        const response = await fetch(`https://api.moysklad.ru/api/remap/1.2/entity/product?limit=50&expand=images`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`MoySklad API error: ${response.statusText}`);
        }

        const data = await response.json();

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
