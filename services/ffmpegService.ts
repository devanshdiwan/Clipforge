
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Clip, BrandSettings } from '../types';

let ffmpeg: FFmpeg | null = null;

const FONT_URL = 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.ttf'; // Roboto Regular
const FONT_NAME = 'Roboto-Regular.ttf';

export async function loadFFmpeg(): Promise<FFmpeg> {
    if (ffmpeg) {
        return ffmpeg;
    }
    ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    // Pre-load the font into FFmpeg's virtual file system
    await ffmpeg.writeFile(`/fonts/${FONT_NAME}`, await fetchFile(FONT_URL));
    return ffmpeg;
}

function escapeFFmpegText(text: string): string {
    return text.replace(/[:'%\\,]/g, '\\$&').replace(/'/g, "'\\\\''");
}

function wrapText(text: string, maxWidth: number = 30): string {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        if ((currentLine + ' ' + word).length > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines.join('\n');
}

export async function processClip(
    ffmpegInstance: FFmpeg,
    videoFile: File,
    clip: Clip,
    settings: BrandSettings,
    onProgress: (progress: number) => void
): Promise<string> {
    ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
    });

    const inputFileName = 'input.mp4';
    const outputFileName = `clip-${clip.id}.mp4`;
    const hasLogo = !!settings.logo;

    await ffmpegInstance.writeFile(inputFileName, await fetchFile(videoFile));

    if (hasLogo) {
        const logoBlob = await fetch(settings.logo!).then(res => res.blob());
        await ffmpegInstance.writeFile('logo.png', await fetchFile(logoBlob));
    }
    
    const command = ['-i', inputFileName];
    if (hasLogo) {
        command.push('-i', 'logo.png');
    }

    command.push(
        '-ss', clip.start.toString(),
        '-to', clip.end.toString()
    );

    const wrappedCaption = wrapText(clip.caption);
    const fontColor = settings.accentColor.substring(1); // Remove #
    
    const videoFilters: string[] = [];
    let filterComplex = '';

    const cropAndScale = `crop=ih*9/16:ih,scale=1080:1920`;
    const drawText = `drawtext=fontfile='/fonts/${FONT_NAME}':text='${escapeFFmpegText(wrappedCaption)}':x=(w-text_w)/2:y=h-th-150:fontsize=72:fontcolor=${fontColor}:box=1:boxcolor=black@0.6:boxborderw=5`;

    if (hasLogo) {
        filterComplex = `[0:v]${cropAndScale}[base];[base]${drawText}[text];[text][1:v]overlay=x=50:y=50`;
        command.push('-filter_complex', filterComplex);
    } else {
        videoFilters.push(cropAndScale, drawText);
        command.push('-vf', videoFilters.join(','));
    }

    command.push(
        '-c:a', 'copy',
        '-y',
        outputFileName
    );

    await ffmpegInstance.exec(command);

    const data = await ffmpegInstance.readFile(outputFileName);
    const blob = new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });

    // Clean up files from virtual file system
    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile(outputFileName);
    if(hasLogo) await ffmpegInstance.deleteFile('logo.png');

    return URL.createObjectURL(blob);
}
