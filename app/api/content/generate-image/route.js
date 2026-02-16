import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request) {
    try {
        const { style, image, product } = await request.json(); // Added 'product' to request body in frontend if needed, or assume it's passed
        console.log('API: generate-image called. Style:', style);

        if (!process.env.OPENAI_API_KEY) {
            // Fallback to Unsplash Mock
            console.log('OpenAI key missing, using Unsplash mock');
            await new Promise(resolve => setTimeout(resolve, 1500));

            let images = [];

            // Try to find keyword in product name for better mock
            const isGadget = (product || '').toLowerCase().match(/часы|наушники|телефон|смарт/);
            const isKitchen = (product || '').toLowerCase().match(/блендер|миксер|кофе|чай/);

            if (isKitchen) {
                images.push(`https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&q=80`); // Kitchen
                images.push(`https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80`); // Food prep
            } else if (isGadget) {
                images.push(`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80`); // Headphones
                images.push(`https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80`); // Watch
            } else {
                images.push(`https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80`); // Gadget
                images.push(`https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80`); // Tech
            }
            return NextResponse.json({ images });
        }

        // If an image is provided, we might want to use it for variations (DALL-E 2 only) or just return it.
        // For now, let's focus on text-to-image generation using DALL-E 3.

        if (image) {
            // TODO: Implement image variations if needed. DALL-E 3 doesn't support variations of uploaded images directly in the same way.
            // For now, return the original to avoid breaking flow.
            return NextResponse.json({ images: [image] });
        }

        const prompt = `Professional product photography of ${product || 'a product'}, style: ${style}. High quality, studio lighting, 4k.`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        const imageUrl = response.data[0].url;

        return NextResponse.json({ images: [imageUrl] });

    } catch (error) {
        console.error('OpenAI Image Error:', error);
        return NextResponse.json({ error: 'Failed to generate images: ' + error.message }, { status: 500 });
    }
}
