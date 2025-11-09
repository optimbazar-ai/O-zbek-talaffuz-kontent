import { decodeAndGetAudioBuffer } from './audioUtils';

export async function mixAudioTracks(
    voiceB64: string,
    backgroundB64: string,
    backgroundVolume: number = 0.2
): Promise<string> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    try {
        // Decode both audio tracks
        const { buffer: voiceBuffer } = await decodeAndGetAudioBuffer(voiceB64, audioContext, false);
        const { buffer: backgroundBuffer } = await decodeAndGetAudioBuffer(backgroundB64, audioContext, true);
        
        // Use voice duration as the final duration (background music stops when voice ends)
        const duration = voiceBuffer.duration;
        const sampleRate = 24000; // Gemini TTS sample rate
        const numberOfChannels = 1; // Mono output for compatibility
        const length = Math.ceil(duration * sampleRate);
        
        // Create offline context for rendering
        const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
        
        // Create voice source
        const voiceSource = offlineContext.createBufferSource();
        voiceSource.buffer = voiceBuffer;
        
        // Create background music source
        const backgroundSource = offlineContext.createBufferSource();
        backgroundSource.buffer = backgroundBuffer;
        backgroundSource.loop = true; // Loop background music if it's shorter
        
        // Create gain nodes for volume control
        const voiceGain = offlineContext.createGain();
        voiceGain.gain.value = 1.0; // Full volume for voice
        
        const backgroundGain = offlineContext.createGain();
        backgroundGain.gain.value = backgroundVolume; // Reduced volume for background
        
        // Apply fade in/out to background music
        backgroundGain.gain.setValueAtTime(0, 0);
        backgroundGain.gain.linearRampToValueAtTime(backgroundVolume, 0.5); // Fade in over 0.5 seconds
        
        // Keep constant volume until near the end, then fade out
        if (duration > 1) {
            backgroundGain.gain.setValueAtTime(backgroundVolume, duration - 0.5);
            backgroundGain.gain.linearRampToValueAtTime(0, duration); // Fade out over last 0.5 seconds
        } else {
            // For very short audio, just fade out quickly
            backgroundGain.gain.setValueAtTime(backgroundVolume, duration - 0.1);
            backgroundGain.gain.linearRampToValueAtTime(0, duration);
        }
        
        // Connect nodes
        voiceSource.connect(voiceGain);
        voiceGain.connect(offlineContext.destination);
        
        backgroundSource.connect(backgroundGain);
        backgroundGain.connect(offlineContext.destination);
        
        // Start both sources
        voiceSource.start(0);
        backgroundSource.start(0);
        
        // Stop background music when voice ends (even if it's looping)
        backgroundSource.stop(duration);
        
        // Render the mixed audio
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to PCM format for compatibility (mono)
        const channelData = renderedBuffer.getChannelData(0); // Get mono channel
        const pcmData = new Int16Array(renderedBuffer.length);
        for (let i = 0; i < renderedBuffer.length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            pcmData[i] = Math.floor(sample * 32767);
        }
        
        // Convert to base64
        const uint8Array = new Uint8Array(pcmData.buffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
        }
        const base64Audio = btoa(binaryString);
        
        return base64Audio;
    } finally {
        await audioContext.close();
    }
}
