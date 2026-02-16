import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path for fluent-ffmpeg
let ffmpegPath = ffmpegStatic;
// Fix for Next.js dev environment or erratic path resolution
if (!ffmpegPath || ffmpegPath.startsWith('/ROOT') || !fs.existsSync(ffmpegPath)) {
    // Try standard node_modules location
    const possiblePath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
    if (fs.existsSync(possiblePath)) {
        ffmpegPath = possiblePath;
    }
}
ffmpeg.setFfmpegPath(ffmpegPath);

// Helper to download image to temp file
async function downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const tempPath = path.join(os.tmpdir(), `temp_img_${Date.now()}.jpg`);
    await fs.promises.writeFile(tempPath, buffer);
    return tempPath;
}

// Helper to escape text for FFmpeg drawtext
function escapeFFmpegText(text) {
    return text.replace(/:/g, '\\:').replace(/'/g, "'\\\\''");
}

function createAssContent(text) {
    // Escape backslashes and braces for ASS
    const safeText = text.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
    return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1440

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Slogan,NotoSans-Regular,80,&H00FFFFFF,&H00000000,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,0,2,30,30,250,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Slogan,,0,0,0,,${safeText}`;
}

async function generateSlogan(productName, apiKey) {
    if (!apiKey) return "НОВИНКА";
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Придумай 1 короткую, взрывную рекламную фразу для товара: '${productName}'. Максимум 3 слова. Без кавычек. На русском.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim().toUpperCase().replace(/["\n]/g, '');
    } catch (error) {
        console.error("Gemini Error:", error);
        return "ХИТ ПРОДАЖ";
    }
}

export async function POST(request) {
    try {
        const { image, product, text } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        // API Key (Try Google first, then generic env)
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        // 1. Determine Slogan
        let slogan = text;
        if (!slogan) {
            slogan = await generateSlogan(product, apiKey);
        }

        // Escape slogan for FFmpeg
        const safeSlogan = escapeFFmpegText(slogan || "ЛУЧШИЙ ВЫБОР");

        // 2. Download Image
        console.log(`[API] Downloading image for ${product}...`);
        let inputPath;
        if (image.startsWith('http')) {
            inputPath = await downloadImage(image);
        } else {
            // If local path (testing), ensure it exists
            return NextResponse.json({ error: 'Local paths not supported in Vercel' }, { status: 400 });
        }

        // 3. Setup Paths
        const videoId = Date.now();
        const outputFilename = `video_${videoId}.mp4`;
        const publicDir = path.join(process.cwd(), 'public', 'videos');
        const outputPath = path.join(publicDir, outputFilename);
        const fontsDir = path.join(process.cwd(), 'public', 'fonts'); // Directory for libass

        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // Generate ASS file
        const assPath = path.join(os.tmpdir(), `slogan_${videoId}.ass`);
        const assContent = createAssContent(slogan || "ЛУЧШИЙ ВЫБОР"); // Use unescaped slogan here
        await fs.promises.writeFile(assPath, assContent);

        // 4. Generate Video with FFmpeg
        console.log(`[API] Rendering video... Slogan: ${slogan}`);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .inputOptions(['-loop 1', '-t 5']) // 5 seconds loop
                .videoFilters([
                    'scale=-2:1440',
                    'crop=1080:1440',
                    "zoompan=z='min(zoom+0.0006,1.1)':d=125:s=1080x1440:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'",
                    `subtitles=${assPath}:fontsdir=${fontsDir}`
                ])
                .outputOptions([
                    '-c:v libx264',
                    '-pix_fmt yuv420p',
                    '-r 25'
                ])
                .save(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        // Cleanup temp files
        try {
            await fs.promises.unlink(inputPath);
            await fs.promises.unlink(assPath);
        } catch (e) { /* ignore */ }

        console.log(`[API] Video generated: ${outputFilename}`);

        return NextResponse.json({
            success: true,
            videoUrl: `/videos/${outputFilename}`,
            slogan: slogan
        });

    } catch (error) {
        console.error('[API] Video Generation Error:', error);
        return NextResponse.json({
            error: 'Failed to generate video: ' + error.message,
            debug: {
                ffmpegPath: ffmpegStatic,
                cwd: process.cwd(),
                env: process.env.NODE_ENV
            }
        }, { status: 500 });
    }
}
