
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const os = require('os');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegStatic);

const inputPath = 'test_image.jpg'; // We need a real image
const outputFilename = `test_video_speed_${Date.now()}.mp4`;
const outputStartPath = path.join(__dirname, outputFilename);
const fontsDir = path.join(__dirname, 'public', 'fonts');

// Mock ASS content
const assPath = path.join(os.tmpdir(), `test_slogan.ass`);
const assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1440
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Slogan,NotoSans-Regular,80,&H00FFFFFF,&H00000000,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,0,2,30,30,250,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Slogan,,0,0,0,,TEST SPEED`;

fs.writeFileSync(assPath, assContent);

// Download a test image first if not exists
async function ensureImage() {
    if (!fs.existsSync(inputPath)) {
        const res = await fetch('https://placehold.co/600x400/png');
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(inputPath, buffer);
    }
}

async function runTest() {
    await ensureImage();
    console.log('Starting FFmpeg speed test...');
    const start = Date.now();

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .inputOptions(['-loop 1', '-t 3'])
            .videoFilters([
                'scale=-2:960',
                'crop=720:960',
                // "zoompan=z='min(zoom+0.0006,1.1)':d=75:s=720x960:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'", // TOO SLOW
                //`subtitles=${assPath}:fontsdir=${fontsDir}` // Skip subtitles if font not found in test env
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

    const duration = Date.now() - start;
    console.log(`FFmpeg completed in ${duration}ms`);

    // Check file size
    const stat = fs.statSync(outputStartPath);
    console.log(`Output file size: ${stat.size} bytes`);

    // Cleanup
    fs.unlinkSync(outputStartPath);
}

runTest().catch(console.error);
