import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { createClient } from '@supabase/supabase-js';

// Set ffmpeg path for fluent-ffmpeg
let ffmpegPath = ffmpegStatic;

// Fix for Vercel/Next.js environment
if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    const pathsToCheck = [
        path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
        path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'bin', 'linux', 'x64', 'ffmpeg'),
        '/var/task/node_modules/ffmpeg-static/ffmpeg',
    ];
    for (const p of pathsToCheck) {
        if (fs.existsSync(p)) {
            ffmpegPath = p;
            break;
        }
    }
}
if (!ffmpegPath) ffmpegPath = ffmpegStatic;
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize Supabase Client
const getSupabaseKey = () => {
    return (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
};
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = getSupabaseKey();

// Helper to download image to temp file (supports URLs and Base64)
async function downloadImage(imageInput) {
    const tempPath = path.join(os.tmpdir(), `temp_img_${Date.now()}.jpg`);

    if (imageInput.startsWith('data:')) {
        const base64Data = imageInput.split(';base64,').pop();
        await fs.promises.writeFile(tempPath, base64Data, { encoding: 'base64' });
        return tempPath;
    }

    const headers = {};
    if (imageInput.includes('api.moysklad.ru')) {
        const login = process.env.MOYSKLAD_LOGIN;
        const password = process.env.MOYSKLAD_PASSWORD;
        if (login && password) {
            const auth = Buffer.from(`${login}:${password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }
    }

    const response = await fetch(imageInput, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(tempPath, buffer);
    return tempPath;
}

// Helper to escape text for FFmpeg drawtext
function escapeFFmpegText(text) {
    return text.replace(/:/g, '\\:').replace(/'/g, "'\\\\''");
}

function createAssContent(text) {
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

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { image, product, text } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials missing');
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        let slogan = text;
        if (!slogan) {
            try {
                slogan = await generateSlogan(product, apiKey);
            } catch (slgErr) {
                slogan = "ЛУЧШИЙ ВЫБОР";
            }
        }

        let inputPath;
        try {
            inputPath = await downloadImage(image);
        } catch (dlErr) {
            return NextResponse.json({ error: 'Image download failed: ' + dlErr.message }, { status: 400 });
        }

        const videoId = Date.now();
        const outputFilename = `video_${videoId}.mp4`;
        const outputStartPath = path.join(os.tmpdir(), outputFilename);
        const fontsDir = path.join(process.cwd(), 'public', 'fonts');

        const assPath = path.join(os.tmpdir(), `slogan_${videoId}.ass`);
        const assContent = createAssContent(slogan);
        await fs.promises.writeFile(assPath, assContent);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .inputOptions(['-loop 1', '-t 3'])
                .videoFilters([
                    'scale=-2:960',
                    'crop=720:960',
                    `subtitles=${assPath}:fontsdir=${fontsDir}`
                ])
                .outputOptions([
                    '-c:v libx264',
                    '-preset ultrafast',
                    '-pix_fmt yuv420p',
                    '-r 20',
                    '-crf 28'
                ])
                .save(outputStartPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        const videoBuffer = await fs.promises.readFile(outputStartPath);

        const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(outputFilename, videoBuffer, {
                contentType: 'video/mp4',
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(outputFilename);

        try {
            await fs.promises.unlink(inputPath);
            await fs.promises.unlink(assPath);
            await fs.promises.unlink(outputStartPath);
        } catch (e) { }

        return NextResponse.json({
            success: true,
            videoUrl: publicUrl,
            slogan: slogan
        });

    } catch (error) {
        console.error('[API] Video Generation Error:', error);
        return NextResponse.json({
            error: 'Failed to generate video: ' + error.message
        }, { status: 500 });
    }
}
