
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { decodeAndGetAudioBuffer } from '../utils/audioUtils';
import { IconComponents } from './IconComponents';
import type { TimedScriptChunk } from '../types';

interface ReelPreviewProps {
  imageUrls: string[];
  audioB64: string;
  title: string;
  timedScript: TimedScriptChunk[];
}

export const ReelPreview: React.FC<ReelPreviewProps> = ({ imageUrls, audioB64, title, timedScript }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const animationFrameRef = useRef<number>();
  const playbackStartTimeRef = useRef<number>(0);

  const subtitleLoop = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return;

    const elapsedTime = audioContextRef.current.currentTime - playbackStartTimeRef.current;
    const activeChunk = timedScript.find(chunk => elapsedTime >= chunk.start && elapsedTime < chunk.end);
    
    const newSubtitle = activeChunk ? activeChunk.text : '';
    if (newSubtitle !== currentSubtitle) {
      setCurrentSubtitle(newSubtitle);
    }

    // Change image every duration/4 seconds (4 images total)
    if (duration > 0 && imageUrls.length > 0) {
      const imageInterval = duration / imageUrls.length;
      const newImageIndex = Math.min(Math.floor(elapsedTime / imageInterval), imageUrls.length - 1);
      if (newImageIndex !== currentImageIndex) {
        setCurrentImageIndex(newImageIndex);
      }
    }

    animationFrameRef.current = requestAnimationFrame(subtitleLoop);
  }, [timedScript, isPlaying, currentSubtitle, duration, imageUrls.length, currentImageIndex]);
  
  const stopSubtitleLoop = useCallback(() => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    setCurrentSubtitle('');
  }, []);

  useEffect(() => {
    const setupAudio = async () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                gainNodeRef.current = audioContextRef.current.createGain();
                gainNodeRef.current.connect(audioContextRef.current.destination);
            }
            const { buffer, duration: audioDuration } = await decodeAndGetAudioBuffer(audioB64, audioContextRef.current);
            audioBufferRef.current = buffer;
            setDuration(audioDuration);
            setIsReady(true);
        } catch (error) {
            console.error("Failed to decode audio:", error);
            setIsReady(false);
        }
    };
    setupAudio();

    return () => {
        audioSourceRef.current?.stop();
        audioSourceRef.current?.disconnect();
        stopSubtitleLoop();
    };
  }, [audioB64, stopSubtitleLoop]);
  
  useEffect(() => {
    if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(subtitleLoop);
    } else {
        stopSubtitleLoop();
    }
    return () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };
  }, [isPlaying, subtitleLoop, stopSubtitleLoop]);

  const playAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
    }
    
    audioSourceRef.current = audioContextRef.current.createBufferSource();
    audioSourceRef.current.buffer = audioBufferRef.current;
    audioSourceRef.current.connect(gainNodeRef.current);
    
    playbackStartTimeRef.current = audioContextRef.current.currentTime;
    audioSourceRef.current.start(0);

    audioSourceRef.current.onended = () => {
        setIsPlaying(false);
        if (imageRef.current) {
            imageRef.current.classList.remove('animate-ken-burns');
        }
    };
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
      setCurrentImageIndex(0);
      if (imageRef.current) {
        imageRef.current.classList.remove('animate-ken-burns');
      }
    } else {
        if (!isReady) return;
        setCurrentImageIndex(0);
        playAudio();
        setIsPlaying(true);
        if (imageRef.current) {
            imageRef.current.classList.remove('animate-ken-burns');
            void imageRef.current.offsetWidth;
            imageRef.current.classList.add('animate-ken-burns');
        }
    }
  };

  const handleMuteToggle = () => {
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = isMuted ? 1 : 0;
        setIsMuted(!isMuted);
      }
  };

  return (
    <div className="aspect-[9/16] w-full max-w-[300px] mx-auto bg-black rounded-3xl shadow-2xl overflow-hidden relative border-4 border-slate-700">
      <img
        ref={imageRef}
        src={imageUrls[currentImageIndex]}
        alt="Generated content"
        className="w-full h-full object-cover transition-opacity duration-500"
        style={{ '--animation-duration': `${duration}s` } as React.CSSProperties}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      
      <div className="absolute top-0 left-0 right-0 p-6 pt-10">
          <h2 className="text-white text-center text-3xl font-bold" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
              {title}
          </h2>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 flex items-center justify-center pointer-events-none">
          {currentSubtitle && (
              <p 
                  key={currentSubtitle}
                  className="text-center text-2xl lg:text-3xl font-bold text-yellow-300 animate-fade-in"
                  style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 3px 3px 6px rgba(0,0,0,0.8)' }}
              >
                  {currentSubtitle}
              </p>
          )}
      </div>

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <IconComponents.LoaderIcon className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {isReady && (
         <div className="absolute inset-0 flex items-center justify-center">
            <button
                onClick={handlePlayPause}
                className="w-20 h-20 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={isPlaying ? "Pauza" : "Ijro etish"}
            >
                {isPlaying ? <IconComponents.PauseIcon className="w-12 h-12" /> : <IconComponents.PlayIcon className="w-12 h-12 pl-1" />}
            </button>
        </div>
      )}

      <div className="absolute bottom-4 right-4">
        <button 
            onClick={handleMuteToggle}
            className="w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
        >
            {isMuted ? <IconComponents.MutedIcon className="w-6 h-6" /> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>}
        </button>
      </div>

    </div>
  );
};