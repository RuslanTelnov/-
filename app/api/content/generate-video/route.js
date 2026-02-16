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
// Fix for Next.js dev environment or erratic path resolution
if (!ffmpegPath || ffmpegPath.startsWith('/ROOT') || !fs.existsSync(ffmpegPath)) {
    // Try standard node_modules location
    const possiblePath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
    if (fs.existsSync(possiblePath)) {
        ffmpegPath = possiblePath;
    }
}
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: SERVICE_ROLE_KEY is preferred for uploading if RLS policies are strict, 
// but ANON_KEY works if bucket is public and policies allow.

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

// Set max execution time for Vercel (60 seconds)
export const maxDuration = 60;
export const dynamic = 'force-dynamic'; // Prevent static optimization issues

export async function POST(request) {
    const startTime = Date.now();
    console.log('[API] Start video generation request');

    try {
        const { image, product, text } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        // Validate Supabase
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase credentials missing in environment variables');
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        // API Key (Try Google first, then generic env)
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

        // 1. Determine Slogan
        let slogan = text;
        if (!slogan) {
            slogan = await generateSlogan(product, apiKey);
        }
        console.log(`[API] Slogan generated in ${Date.now() - startTime}ms: ${slogan}`);

        // Escape slogan for FFmpeg
        const safeSlogan = escapeFFmpegText(slogan || "ЛУЧШИЙ ВЫБОР");

        // 2. Download Image
        console.log(`[API] Downloading image...`);
        const dlStart = Date.now();
        let inputPath;
        if (image.startsWith('http')) {
            inputPath = await downloadImage(image);
        } else {
            return NextResponse.json({ error: 'Local paths not supported in Vercel' }, { status: 400 });
        }
        console.log(`[API] Image downloaded in ${Date.now() - dlStart}ms`);

        // 3. Setup Paths (Use TMPDIR for Vercel)
        const videoId = Date.now();
        const outputFilename = `video_${videoId}.mp4`;
        const outputStartPath = path.join(os.tmpdir(), outputFilename); // Write to /tmp
        const fontsDir = path.join(process.cwd(), 'public', 'fonts'); // Read fonts from project

        // Generate ASS file
        const assPath = path.join(os.tmpdir(), `slogan_${videoId}.ass`);
        const assContent = createAssContent(slogan || "ЛУЧШИЙ ВЫБОР");
        await fs.promises.writeFile(assPath, assContent);

        // 4. Generate Video with FFmpeg
        console.log(`[API] Starting FFmpeg render...`);
        const renderStart = Date.now();

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .inputOptions(['-loop 1', '-t 3']) // Reduced duration to 3 seconds for speed
                .videoFilters([
                    // Reduced resolution to 720x960 (half of 1440p) for faster encoding
                    'scale=-2:960',
                    'crop=720:960',
                    // "zoompan=..." removed due to high CPU usage causing 504 timeouts
                    `subtitles=${assPath}:fontsdir=${fontsDir}`
                ])
                .outputOptions([
                    '-c:v libx264',
                    '-preset ultrafast', // Maximum speed
                    '-pix_fmt yuv420p',
                    '-r 20', // Low framerate
                    '-crf 28' // Lower quality for speed
                ])
                .save(outputStartPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });
        console.log(`[API] FFmpeg render completed in ${Date.now() - renderStart}ms`);

        // 5. Upload to Supabase
        console.log(`[API] Uploading to Supabase bucket 'videos'...`);
        const uploadStart = Date.now();
        const videoBuffer = await fs.promises.readFile(outputStartPath);

        const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(outputFilename, videoBuffer, {
                contentType: 'video/mp4',
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Supabase upload failed: ${uploadError.message}`);
        }
        console.log(`[API] Upload completed in ${Date.now() - uploadStart}ms`);

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(outputFilename);

        // Cleanup temp files
        try {
            await fs.promises.unlink(inputPath);
            await fs.promises.unlink(assPath);
            await fs.promises.unlink(outputStartPath);
        } catch (e) { /* ignore */ }

        console.log(`[API] Video generated and uploaded: ${publicUrl}`);

        return NextResponse.json({
            success: true,
            videoUrl: publicUrl,
            slogan: slogan
        });

    } catch (error) {
        console.error('[API] Video Generation Error:', error);

        let debugInfo = {
            message: error.message,
            stack: error.stack,
            env: {
                hasGoogleKey: !!apiKey,
                hasSupabaseUrl: !!supabaseUrl,
                hasSupabaseKey: !!supabaseKey,
                nodeEnv: process.env.NODE_ENV
            },
            fs: {
                cwd: process.cwd(),
                filesInCwd: [],
                filesInPublic: [],
                fontPathExists: false
            }
        };

        try {
            debugInfo.fs.filesInCwd = fs.readdirSync(process.cwd());
            const publicPath = path.join(process.cwd(), 'public');
            if (fs.existsSync(publicPath)) {
                debugInfo.fs.filesInPublic = fs.readdirSync(publicPath);
                const fontPath = path.join(publicPath, 'fonts', 'NotoSans-Regular.ttf');
                debugInfo.fs.fontPathExists = fs.existsSync(fontPath);
            }
        } catch (e) {
            debugInfo.fs.error = e.message;
        }

        return NextResponse.json({
            error: 'Failed to generate video: ' + error.message,
            debug: debugInfo
        }, { status: 500 });
    }
}
