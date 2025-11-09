
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Ensure the data is properly aligned for Int16Array
  const alignedLength = Math.floor(data.length / 2) * 2;
  const alignedData = data.slice(0, alignedLength);
  
  // Create Int16Array from aligned data
  const dataInt16 = new Int16Array(alignedData.buffer, alignedData.byteOffset, alignedLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function decodeAndGetAudioBuffer(base64: string, ctx: AudioContext, isCustomAudio: boolean = false): Promise<{buffer: AudioBuffer, duration: number}> {
    const audioData = decodeBase64(base64);
    
    let audioBuffer: AudioBuffer;
    
    // Try to detect format automatically if not specified
    // Check for common audio file signatures
    const isLikelyCompressed = 
        // MP3 signature
        (audioData[0] === 0xFF && (audioData[1] & 0xE0) === 0xE0) ||
        // WAV signature
        (audioData[0] === 0x52 && audioData[1] === 0x49 && audioData[2] === 0x46 && audioData[3] === 0x46) ||
        // M4A/AAC signature
        (audioData[4] === 0x66 && audioData[5] === 0x74 && audioData[6] === 0x79 && audioData[7] === 0x70) ||
        // OGG signature
        (audioData[0] === 0x4F && audioData[1] === 0x67 && audioData[2] === 0x67 && audioData[3] === 0x53);
    
    const shouldUseNativeDecoder = isCustomAudio || isLikelyCompressed;
    
    if (shouldUseNativeDecoder) {
        // For compressed audio formats, use native decodeAudioData
        try {
            const arrayBuffer = audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength);
            audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            console.log('Successfully decoded audio using native decoder');
        } catch (e) {
            console.error('Failed to decode as compressed audio, trying as PCM:', e);
            // Fallback to PCM decoding
            try {
                audioBuffer = await decodeAudioData(
                    audioData,
                    ctx,
                    24000,
                    1
                );
                console.log('Successfully decoded as PCM');
            } catch (pcmError) {
                console.error('PCM decoding also failed:', pcmError);
                throw new Error('Audio formatini aniqlab bo\'lmadi. MP3, WAV yoki M4A formatdagi fayl yuklang.');
            }
        }
    } else {
        // For Gemini TTS (PCM format)
        try {
            audioBuffer = await decodeAudioData(
                audioData,
                ctx,
                24000, // Gemini TTS sample rate
                1 // Mono channel
            );
            console.log('Successfully decoded Gemini TTS audio');
        } catch (e) {
            console.error('Failed to decode as PCM, trying native decoder:', e);
            // Try native decoder as last resort
            try {
                const arrayBuffer = audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength);
                audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                console.log('Successfully decoded using native decoder as fallback');
            } catch (nativeError) {
                console.error('All decoding methods failed:', nativeError);
                throw new Error('Audio faylni dekodlab bo\'lmadi. Boshqa formatdagi fayl sinab ko\'ring.');
            }
        }
    }
    
    return { buffer: audioBuffer, duration: audioBuffer.duration };
}
