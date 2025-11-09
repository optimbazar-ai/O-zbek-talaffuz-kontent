import { decodeAndGetAudioBuffer } from './audioUtils';
import type { TimedScriptChunk } from '../types';

const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Don't set crossOrigin for data URLs
        if (!url.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
            console.log('Image loaded successfully:', url.substring(0, 50) + '...');
            resolve(img);
        };
        img.onerror = (err) => {
            console.error('Failed to load image:', url.substring(0, 50) + '...', err);
            reject(new Error(`Rasm yuklanmadi: ${err}`));
        };
        img.src = url;
    });
};

const getWrappedLines = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];
    for (const word of words) {
        const testLine = line + word + ' ';
        if (context.measureText(testLine).width > maxWidth && line.length > 0) {
            lines.push(line.trim());
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());
    return lines;
}

export const createVideoFromReelContent = async (
    imageUrls: string[],
    audioB64: string,
    title: string,
    timedScript: TimedScriptChunk[]
): Promise<{ blob: Blob; fileExtension: 'mp4' | 'webm' }> => {
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    if (!imageUrls || imageUrls.length === 0) {
        throw new Error('Rasmlar mavjud emas. Iltimos, reelni qayta yarating.');
    }
    
    console.log('Loading images...', imageUrls.length, 'images');
    let images = await Promise.all(imageUrls.map((url, index) => {
        console.log(`Loading image ${index + 1}/${imageUrls.length}`);
        return loadImage(url);
    }));
    console.log('All images loaded successfully. Total:', images.length);
    images = images.filter(Boolean);
    if (images.length === 0) {
        throw new Error('Hech qanday rasmni yuklab bo\'lmadi');
    }
    images = images.slice(0, Math.min(images.length, 8));

    if (images.some(img => !img || !img.width || !img.height)) {
        throw new Error('Ba\'zi rasmlar to\'g\'ri yuklanmadi');
    }
    
    const { buffer: audioBuffer } = await decodeAndGetAudioBuffer(audioB64, new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }));
    const duration = audioBuffer.duration;
    console.log('Audio duration:', duration, 'seconds');

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    const destination = audioContext.createMediaStreamDestination();
    audioSource.connect(destination);
    const audioTrack = destination.stream.getAudioTracks()[0];
    
    const videoStream = canvas.captureStream(30);
    const videoTrack = videoStream.getVideoTracks()[0];

    const combinedStream = new MediaStream([videoTrack, audioTrack]);

    const mp4MimeType = 'video/mp4';
    const webmMimeType = 'video/webm';
    
    let chosenMimeType: string;
    let fileExtension: 'mp4' | 'webm';

    if (MediaRecorder.isTypeSupported(mp4MimeType)) {
        chosenMimeType = mp4MimeType;
        fileExtension = 'mp4';
    } else {
        console.warn('MP4 recording not supported, falling back to WebM.');
        chosenMimeType = webmMimeType;
        fileExtension = 'webm';
    }

    const recorder = new MediaRecorder(combinedStream, { mimeType: chosenMimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    };

    const recordingPromise = new Promise<{ blob: Blob; fileExtension: 'mp4' | 'webm' }>((resolve, reject) => {
        recorder.onstop = () => {
            console.log('Recording stopped, chunks:', chunks.length);
            const blob = new Blob(chunks, { type: chosenMimeType });
            console.log('Video blob created, size:', blob.size, 'bytes');
            resolve({ blob, fileExtension });
        };
        recorder.onerror = (event) => {
            console.error('MediaRecorder error:', event);
            reject((event as any).error || new Error('MediaRecorder xatosi yuz berdi'));
        }
    });

    console.log('Starting recorder with mime type:', chosenMimeType);
    recorder.start();
    console.log('Starting audio playback');
    audioSource.start();

    const startTime = performance.now();
    console.log('Video generation started');

    const drawFrame = (currentTime: number) => {
        const elapsedTime = (currentTime - startTime) / 1000;
        
        if (elapsedTime >= duration || recorder.state !== 'recording') {
            console.log('Video generation finished. Elapsed:', elapsedTime, 'Duration:', duration);
            if(recorder.state === 'recording') {
                console.log('Stopping recorder...');
                recorder.stop();
            }
            if (audioContext.state !== 'closed') {
               console.log('Stopping audio...');
               audioSource.stop();
               audioContext.close();
            }
            return;
        }

        const progress = elapsedTime / duration;
        
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        // Determine which image to use based on elapsed time
        const imageInterval = duration / images.length;
        const currentImageIndex = Math.min(Math.floor(elapsedTime / imageInterval), images.length - 1);
        const image = images[currentImageIndex];

        if (!image) {
            console.error('Image not found at index:', currentImageIndex);
            requestAnimationFrame(drawFrame);
            return;
        }

        const scale = 1.2;
        const panRange = 0.08;
        const panAmount = -panRange + (2 * panRange * progress);

        const imgRatio = image.width / image.height;
        const canvasRatio = width / height;
        let sw, sh, sx, sy;

        if (imgRatio > canvasRatio) {
            sh = image.height;
            sw = sh * canvasRatio;
            sx = (image.width - sw) / 2;
            sy = 0;
        } else {
            sw = image.width;
            sh = sw / canvasRatio;
            sx = 0;
            sy = (image.height - sh) / 2;
        }
        
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(panAmount * width, panAmount * height);
        ctx.drawImage(image, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
        ctx.restore();
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 10;
        
        // Draw title
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px sans-serif';
        ctx.textBaseline = 'top';
        const titleMaxWidth = width * 0.9;
        const titleLineHeight = 90;
        const titleLines = getWrappedLines(ctx, title, titleMaxWidth);
        const totalTitleHeight = titleLines.length > 1 ? (titleLines.length * titleLineHeight) - (titleLineHeight - 80) : 80;
        const titleStartY = height * 0.15 - totalTitleHeight / 2;
        titleLines.forEach((line, i) => {
            ctx.fillText(line, width / 2, titleStartY + i * titleLineHeight);
        });

        // Draw Subtitles
        const activeSubtitle = timedScript.find(chunk => elapsedTime >= chunk.start && elapsedTime < chunk.end);
        if (activeSubtitle) {
            ctx.fillStyle = '#FFD700'; // Yellow color
            ctx.font = 'bold 70px sans-serif';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0, 0, 0, 1)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;

            const subtitleMaxWidth = width * 0.9;
            const subtitleLineHeight = 80;
            const subtitleLines = getWrappedLines(ctx, activeSubtitle.text, subtitleMaxWidth);
            const subtitleY = height * 0.9;

            subtitleLines.slice().reverse().forEach((line, i) => {
                ctx.fillText(line, width / 2, subtitleY - (i * subtitleLineHeight));
            });
        }
        ctx.restore();

        requestAnimationFrame(drawFrame);
    };

    requestAnimationFrame(drawFrame);

    return recordingPromise;
};