
const ffmpeg = require('ffmpeg-static');
console.log('FFMPEG Path:', ffmpeg);
const fs = require('fs');
if (ffmpeg && fs.existsSync(ffmpeg)) {
    console.log('Binary exists!');
} else {
    console.log('Binary MISSING!');
}
