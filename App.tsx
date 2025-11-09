
import React, { useState, useCallback } from 'react';
import { generateScriptAndImagePrompt, generateImage, generateAudio, generateTrendingTopics } from './services/geminiService';
import type { GenerationStatus, ProgressStep, ReelContent, VoiceOption, TopicCategory, TimedScriptChunk } from './types';
import { initialProgressSteps, availableVoices } from './constants';
import { ReelPreview } from './components/ReelPreview';
import { IconComponents } from './components/IconComponents';
import { ProgressTracker } from './components/ProgressTracker';
import { createVideoFromReelContent } from './utils/videoGenerator';
import { TrendingTopicsModal } from './components/TrendingTopicsModal';
import { decodeAndGetAudioBuffer } from './utils/audioUtils';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Zephyr');
  const [status, setStatus] = useState<GenerationStatus>('IDLE');
  const [progress, setProgress] = useState<ProgressStep[]>(initialProgressSteps);
  const [reelContent, setReelContent] = useState<Partial<ReelContent> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string>('');

  // Image sourcing state
  const [imageSourceMode, setImageSourceMode] = useState<'auto' | 'custom' | 'upload' | 'video'>('auto');
  const [customImageQuery, setCustomImageQuery] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideoName, setUploadedVideoName] = useState<string>('');
  
  // Audio state
  const [audioMode, setAudioMode] = useState<'ai' | 'custom' | 'mixed'>('ai');
  const [uploadedAudioB64, setUploadedAudioB64] = useState<string>('');
  const [uploadedAudioName, setUploadedAudioName] = useState<string>('');
  const [backgroundMusicB64, setBackgroundMusicB64] = useState<string>('');
  const [backgroundMusicName, setBackgroundMusicName] = useState<string>('');
  const [backgroundVolume, setBackgroundVolume] = useState<number>(0.2); // 20% volume for background

  // State for trending topics feature
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState<boolean>(false);
  const [trendingTopics, setTrendingTopics] = useState<TopicCategory[]>([]);
  const [isTopicsLoading, setIsTopicsLoading] = useState<boolean>(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);


  const updateProgress = (stepId: ProgressStep['id'], status: ProgressStep['status']) => {
    setProgress(prev =>
      prev.map(step => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || status === 'GENERATING') return;
    if ((imageSourceMode === 'upload' || imageSourceMode === 'video') && uploadedImages.length === 0) {
      setError(imageSourceMode === 'video' 
        ? "Avval video yuklang yoki boshqa manba tanlang."
        : "Avval kamida bitta rasm yuklang yoki boshqa rasm manbasini tanlang.");
      return;
    }

    setStatus('GENERATING');
    setError(null);
    setReelContent(null);
    setProgress(initialProgressSteps);
    let currentStep: ProgressStep['id'] = 'script';

    try {
      // Step 1: Generate script and image prompt
      updateProgress('script', 'running');
      const scriptData = await generateScriptAndImagePrompt(topic, useGoogleSearch);
      setReelContent({ 
        script: scriptData.script, 
        imagePrompt: scriptData.imagePrompt,
        sources: scriptData.sources,
        hashtags: scriptData.hashtags,
      });
      updateProgress('script', 'complete');
      
      // Step 2: Generate images
      currentStep = 'image';
      updateProgress('image', 'running');

      let imageUrls: string[] = [];
      if (imageSourceMode === 'upload' || imageSourceMode === 'video') {
        imageUrls = uploadedImages;
        updateProgress('image', 'complete');
      } else {
        const overrideQuery = imageSourceMode === 'custom' ? customImageQuery.trim() : undefined;
        imageUrls = await generateImage(scriptData.imagePrompt, overrideQuery);
        updateProgress('image', 'complete');
      }

      setReelContent(prev => ({ ...prev, imageUrls }));

      // Step 3: Generate or use custom audio and subtitles
      currentStep = 'audio';
      updateProgress('audio', 'running');
      
      let audioB64: string;
      if (audioMode === 'custom' && uploadedAudioB64) {
        audioB64 = uploadedAudioB64;
      } else if (audioMode === 'mixed' && backgroundMusicB64) {
        // Generate AI voice first
        const voiceB64 = await generateAudio(scriptData.script.join(' '), selectedVoice);
        // Mix with background music
        const { mixAudioTracks } = await import('./utils/audioMixer');
        audioB64 = await mixAudioTracks(voiceB64, backgroundMusicB64, backgroundVolume);
      } else {
        audioB64 = await generateAudio(scriptData.script.join(' '), selectedVoice);
      }
      
      // Calculate timings for subtitles
      const audioContextForDuration = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      // For mixed mode, the audio is already in PCM format from our mixer
      const isCustom = audioMode === 'custom';
      const { duration } = await decodeAndGetAudioBuffer(audioB64, audioContextForDuration, isCustom);
      await audioContextForDuration.close();

      const totalChars = scriptData.script.reduce((acc, line) => acc + line.length, 0);
      const charsPerSecond = totalChars > 0 ? totalChars / duration : 10;
      let currentTime = 0;
      const timedScript: TimedScriptChunk[] = scriptData.script.map(line => {
          const lineDuration = line.length / charsPerSecond;
          const chunk = {
              text: line,
              start: currentTime,
              end: currentTime + lineDuration
          };
          currentTime += lineDuration;
          return chunk;
      });

      setReelContent(prev => ({ ...prev, audioB64, timedScript }));
      updateProgress('audio', 'complete');

      setStatus('COMPLETE');
    } catch (e: any) {
      console.error(e);
      setError(`Jarayon bosqichida xatolik yuz berdi: ${currentStep}. ${e.message || "Iltimos, qayta urinib ko'ring."}`);
      updateProgress(currentStep, 'error');
      setStatus('ERROR');
    }
  }, [topic, status, useGoogleSearch, selectedVoice, imageSourceMode, customImageQuery, uploadedImages, audioMode, uploadedAudioB64, backgroundMusicB64, backgroundVolume]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    try {
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const newImages = await Promise.all(files.slice(0, 8).map((file: File) => toBase64(file)));
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 8));
    } catch (uploadError) {
      console.error('Rasmni yuklashda xatolik:', uploadError);
      setError("Rasmni yuklashda xatolik yuz berdi. Iltimos, boshqa fayl bilan urinib ko'ring.");
    } finally {
      event.target.value = '';
    }
  }, []);

  const handleRemoveUploadedImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAudioUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadedAudioName(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64Audio = base64.split(',')[1];
        setUploadedAudioB64(base64Audio);
        setAudioMode('custom');
        setError(null);
      };
      reader.onerror = () => {
        throw new Error('Audio faylni o\'qib bo\'lmadi');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Audio yuklashda xatolik:', error);
      setError('Audio yuklashda xatolik yuz berdi. MP3 yoki WAV formatdagi fayl sinab ko\'ring.');
      setUploadedAudioName('');
      setUploadedAudioB64('');
      setAudioMode('ai');
    } finally {
      event.target.value = '';
    }
  }, []);

  const handleBackgroundMusicUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBackgroundMusicName(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Audio = base64.split(',')[1];
        setBackgroundMusicB64(base64Audio);
        setError(null);
      };
      reader.onerror = () => {
        throw new Error('Musiqa faylni o\'qib bo\'lmadi');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Orqa musiqa yuklashda xatolik:', error);
      setError('Orqa musiqa yuklashda xatolik yuz berdi.');
      setBackgroundMusicName('');
      setBackgroundMusicB64('');
    } finally {
      event.target.value = '';
    }
  }, []);

  const handleVideoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadedVideoName(file.name);
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context yaratib bo\'lmadi');

      const frames: string[] = [];
      const duration = video.duration;
      const frameCount = Math.min(8, Math.max(4, Math.floor(duration))); // 4-8 frames
      
      for (let i = 0; i < frameCount; i++) {
        const time = (duration / frameCount) * i;
        video.currentTime = time;
        
        await new Promise(resolve => {
          video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            frames.push(canvas.toDataURL('image/jpeg', 0.9));
            resolve(null);
          };
        });
      }

      URL.revokeObjectURL(video.src);
      setUploadedImages(frames);
      setError(null);
    } catch (error) {
      console.error('Video yuklashda xatolik:', error);
      setError('Video yuklashda xatolik yuz berdi. MP4 formatdagi video faylni sinab ko\'ring.');
      setUploadedVideoName('');
    } finally {
      event.target.value = '';
    }
  }, []);
  
  const handleDownload = async () => {
    if (!reelContent?.imageUrls || reelContent.imageUrls.length === 0 || !reelContent.audioB64 || !topic || !reelContent.timedScript) return;

    setIsDownloading(true);
    setError(null);

    try {
        const { blob: videoBlob, fileExtension } = await createVideoFromReelContent(
            reelContent.imageUrls,
            reelContent.audioB64,
            topic,
            reelContent.timedScript
        );
        
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const fileName = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExtension}`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

    } catch (e: any) {
        console.error("Error creating video for download:", e);
        setError(`Videoni yuklab olish uchun yaratishda xatolik yuz berdi: ${e.message}`);
    } finally {
        setIsDownloading(false);
    }
  };

  const handleCopyHashtags = () => {
    if (!reelContent?.hashtags) return;
    const hashtagText = reelContent.hashtags.join(' ');
    navigator.clipboard.writeText(hashtagText).then(() => {
        setCopySuccess('Nusxalandi!');
        setTimeout(() => setCopySuccess(''), 2000);
    }).catch(err => {
        console.error('Could not copy text: ', err);
        setCopySuccess('Xatolik!');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  // Handlers for trending topics
  const handleFetchTopics = useCallback(async () => {
    setIsTopicsModalOpen(true);
    if (trendingTopics.length > 0 && !topicsError) return; // Don't refetch if we already have them and there's no error

    setIsTopicsLoading(true);
    setTopicsError(null);
    try {
        const topics = await generateTrendingTopics();
        setTrendingTopics(topics);
    } catch(e: any) {
        setTopicsError(e.message || "Mavzularni yuklab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
        setIsTopicsLoading(false);
    }
  }, [trendingTopics.length, topicsError]);

  const handleSelectTopic = (selectedTopic: string) => {
    setTopic(selectedTopic);
    setIsTopicsModalOpen(false);
  };


  const isLoading = status === 'GENERATING';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
             <IconComponents.SparklesIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-500 text-transparent bg-clip-text">
              AI Reels Yararuvchisi
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Mavzuni kiriting va Gemini ssenariy, noyob rasm va ovozli matn yaratib, qisqa video-reel tayyorlashiga imkon bering.
          </p>
        </header>

        <main className="space-y-8">
          <div className="bg-slate-800/50 p-6 rounded-lg shadow-lg border border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="topic-input" className="block text-lg font-medium text-slate-300">
                Reel Mavzusi
                </label>
                <button
                onClick={handleFetchTopics}
                disabled={isLoading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                <IconComponents.LightbulbIcon className="w-5 h-5" />
                Mavzu G'oyalari
                </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Masalan, Nima uchun osmon ko'k rangda?"
                disabled={isLoading}
                className="flex-grow bg-slate-900 border border-slate-600 rounded-md px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
              />
              <button
                onClick={handleGenerate}
                disabled={!topic.trim() || isLoading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition disabled:bg-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <IconComponents.LoaderIcon className="w-5 h-5 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <IconComponents.MagicWandIcon className="w-5 h-5" />
                    Reel Yaratish
                  </>
                )}
              </button>
            </div>
             <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
                {/* Image Source Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-400">Rasm Manbasi</label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                            onClick={() => {
                                setImageSourceMode('auto');
                                setCustomImageQuery('');
                                setUploadedImages([]);
                                setUploadedVideoName('');
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                imageSourceMode === 'auto' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            🤖 Avtomatik
                        </button>
                        <button
                            onClick={() => {
                                setImageSourceMode('custom');
                                setUploadedImages([]);
                                setUploadedVideoName('');
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                imageSourceMode === 'custom' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            🔍 So'zlarim bilan
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                setImageSourceMode('upload');
                                setCustomImageQuery('');
                                setUploadedVideoName('');
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                imageSourceMode === 'upload' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            📸 O'z rasmim
                        </button>
                        <button
                            onClick={() => {
                                setImageSourceMode('video');
                                setCustomImageQuery('');
                                setUploadedImages([]);
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                imageSourceMode === 'video' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            🎬 O'z videom
                        </button>
                    </div>
                    
                    {/* Custom Search Input */}
                    {imageSourceMode === 'custom' && (
                        <div className="mt-3">
                            <input
                                type="text"
                                value={customImageQuery}
                                onChange={(e) => setCustomImageQuery(e.target.value)}
                                placeholder="Inglizcha kalit so'zlar (masalan: Eldor Shomurodov football Turkey)"
                                className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                            <p className="text-xs text-slate-500 mt-1">💡 Aniq natijalar uchun inglizcha yozing</p>
                        </div>
                    )}
                    
                    {/* Upload Interface */}
                    {imageSourceMode === 'upload' && (
                        <div className="mt-3 space-y-3">
                            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-indigo-500 transition">
                                <input
                                    type="file"
                                    id="image-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <div className="space-y-2">
                                        <div className="text-3xl">📁</div>
                                        <p className="text-sm text-slate-300">Rasmlarni tanlash uchun bosing</p>
                                        <p className="text-xs text-slate-500">Maksimum 8 ta rasm</p>
                                    </div>
                                </label>
                            </div>
                            
                            {/* Preview uploaded images */}
                            {uploadedImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {uploadedImages.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <img 
                                                src={img} 
                                                alt={`Upload ${index + 1}`}
                                                className="w-full h-20 object-cover rounded-md"
                                            />
                                            <button
                                                onClick={() => handleRemoveUploadedImage(index)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-slate-500">✅ {uploadedImages.length}/8 rasm yuklandi</p>
                        </div>
                    )}
                    
                    {/* Video Upload Interface */}
                    {imageSourceMode === 'video' && (
                        <div className="mt-3 space-y-3">
                            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-indigo-500 transition">
                                <input
                                    type="file"
                                    id="video-upload"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                />
                                <label htmlFor="video-upload" className="cursor-pointer">
                                    <div className="space-y-2">
                                        <div className="text-3xl">🎬</div>
                                        <p className="text-sm text-slate-300">Video tanlash uchun bosing</p>
                                        <p className="text-xs text-slate-500">MP4, MOV, AVI formatlar</p>
                                    </div>
                                </label>
                            </div>
                            
                            {/* Show video name if uploaded */}
                            {uploadedVideoName && (
                                <div className="bg-slate-800 rounded-lg p-3">
                                    <p className="text-sm text-green-400">✅ Video yuklandi: {uploadedVideoName}</p>
                                    <p className="text-xs text-slate-500 mt-1">{uploadedImages.length} ta kadr olindi</p>
                                </div>
                            )}
                            
                            {/* Preview extracted frames */}
                            {uploadedImages.length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">Videodan olingan kadrlar:</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {uploadedImages.map((img, index) => (
                                            <div key={index} className="relative">
                                                <img 
                                                    src={img} 
                                                    alt={`Frame ${index + 1}`}
                                                    className="w-full h-20 object-cover rounded-md"
                                                />
                                                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                                                    {index + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Google Search Toggle */}
                <div className="flex items-center justify-start">
                    <label htmlFor="google-search-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                id="google-search-toggle" 
                                className="sr-only"
                                checked={useGoogleSearch}
                                onChange={(e) => setUseGoogleSearch(e.target.checked)}
                                disabled={isLoading}
                            />
                            <div className="block bg-slate-700 w-14 h-8 rounded-full transition"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${useGoogleSearch ? 'transform translate-x-full bg-indigo-400' : 'bg-slate-400'}`}></div>
                        </div>
                        <div className="ml-3 text-slate-300 font-medium">
                            Google Qidiruv bilan real vaqtdagi ma'lumotlarni olish
                        </div>
                    </label>
                </div>
                 <div className="space-y-3">
                    <label htmlFor="voice-select" className="block text-sm font-medium text-slate-400">
                        Ovoz / Musiqa
                    </label>
                    
                    {/* Audio source toggle */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => {
                                setAudioMode('ai');
                                setUploadedAudioB64('');
                                setUploadedAudioName('');
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                audioMode === 'ai' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            🎙️ AI Ovoz
                        </button>
                        <button
                            onClick={() => setAudioMode('custom')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                audioMode === 'custom' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            🎵 O'z musiqam
                        </button>
                        <button
                            onClick={() => setAudioMode('mixed')}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                                audioMode === 'mixed' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            🎶 AI + Musiqa
                        </button>
                    </div>
                    
                    {/* AI Voice selection */}
                    {(audioMode === 'ai' || audioMode === 'mixed') && (
                        <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value as VoiceOption)}
                            disabled={isLoading}
                            className="w-full sm:max-w-xs bg-slate-900 border border-slate-600 rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
                        >
                            {availableVoices.map(voice => (
                                <option key={voice.id} value={voice.id}>{voice.name}</option>
                            ))}
                        </select>
                    )}
                    
                    {/* Background music for mixed mode */}
                    {audioMode === 'mixed' && (
                        <div className="space-y-3">
                            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-indigo-500 transition">
                                <input
                                    type="file"
                                    id="bg-music-upload"
                                    accept="audio/*"
                                    onChange={handleBackgroundMusicUpload}
                                    className="hidden"
                                />
                                <label htmlFor="bg-music-upload" className="cursor-pointer">
                                    <div className="space-y-2">
                                        <div className="text-3xl">🎶</div>
                                        <p className="text-sm text-slate-300">Orqa musiqa tanlash</p>
                                        <p className="text-xs text-slate-500">Sokin yoki ruhlantiruvchi musiqa</p>
                                    </div>
                                </label>
                            </div>
                            
                            {backgroundMusicName && (
                                <div className="bg-slate-800 rounded-lg p-3">
                                    <p className="text-sm text-green-400">✅ Orqa musiqa: {backgroundMusicName}</p>
                                    <div className="mt-2">
                                        <label className="text-xs text-slate-400">Ovoz balandligi: {Math.round(backgroundVolume * 100)}%</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={backgroundVolume * 100}
                                            onChange={(e) => setBackgroundVolume(Number(e.target.value) / 100)}
                                            className="w-full mt-1"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setBackgroundMusicB64('');
                                            setBackgroundMusicName('');
                                        }}
                                        className="text-xs text-red-400 hover:text-red-300 mt-1"
                                    >
                                        O'chirish
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Custom audio upload */}
                    {audioMode === 'custom' && (
                        <div className="space-y-3">
                            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-indigo-500 transition">
                                <input
                                    type="file"
                                    id="audio-upload"
                                    accept="audio/*"
                                    onChange={handleAudioUpload}
                                    className="hidden"
                                />
                                <label htmlFor="audio-upload" className="cursor-pointer">
                                    <div className="space-y-2">
                                        <div className="text-3xl">🎵</div>
                                        <p className="text-sm text-slate-300">Musiqa/Audio tanlash</p>
                                        <p className="text-xs text-slate-500">MP3, WAV, M4A formatlar</p>
                                    </div>
                                </label>
                            </div>
                            
                            {uploadedAudioName && (
                                <div className="bg-slate-800 rounded-lg p-3">
                                    <p className="text-sm text-green-400">✅ Audio yuklandi: {uploadedAudioName}</p>
                                    <button
                                        onClick={() => {
                                            setUploadedAudioB64('');
                                            setUploadedAudioName('');
                                        }}
                                        className="text-xs text-red-400 hover:text-red-300 mt-1"
                                    >
                                        O'chirish
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
          </div>

          {status !== 'IDLE' && <ProgressTracker steps={progress} />}
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-start gap-3">
              <IconComponents.ErrorIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold">Xatolik Yuz Berdi</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {status === 'COMPLETE' && reelContent?.imageUrls && reelContent.imageUrls.length > 0 && reelContent.audioB64 && reelContent.timedScript && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center">Sizning Reelingiz Tayyor!</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1">
                        <ReelPreview 
                            title={topic}
                            imageUrls={reelContent.imageUrls} 
                            audioB64={reelContent.audioB64}
                            timedScript={reelContent.timedScript}
                        />
                    </div>
                    <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-lg border border-slate-700 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-cyan-400">Rasm uchun tavsif</h3>
                            <p className="text-slate-400 italic">"{reelContent.imagePrompt}"</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-cyan-400">Ssenariy</h3>
                            <p className="text-slate-300 whitespace-pre-wrap">{reelContent.script?.join('\n')}</p>
                        </div>
                        {reelContent.hashtags && reelContent.hashtags.length > 0 && (
                            <div className="pt-4 border-t border-slate-700/50">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                                        <IconComponents.HashtagIcon className="w-5 h-5" />
                                        Tavsiya etilgan Heshteglar
                                    </h3>
                                    <button onClick={handleCopyHashtags} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors relative font-semibold px-3 py-1 rounded-md bg-slate-700/50 hover:bg-slate-700">
                                        {copySuccess ? copySuccess : 'Nusxalash'}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {reelContent.hashtags.map((tag, index) => (
                                        <span key={index} className="bg-slate-700 text-cyan-300 text-sm font-medium px-3 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                         {reelContent.sources && reelContent.sources.length > 0 && (
                            <div className="pt-4 border-t border-slate-700/50">
                                <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                                    <IconComponents.LinkIcon className="w-5 h-5" />
                                    Manbalar
                                </h3>
                                <ul className="list-none space-y-1 mt-2">
                                    {reelContent.sources.map((source, index) => (
                                        <li key={index} className="text-slate-400 truncate">
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline hover:text-indigo-300 transition inline-flex items-center gap-1.5">
                                                <span>{source.title || source.uri}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex justify-center pt-4">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-slate-900 transition disabled:bg-green-800 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <>
                                <IconComponents.LoaderIcon className="w-5 h-5 animate-spin" />
                                Yuklanmoqda...
                            </>
                        ) : (
                            <>
                                <IconComponents.DownloadIcon className="w-5 h-5" />
                                Videoni yuklab olish
                            </>
                        )}
                    </button>
                </div>
            </div>
          )}
        </main>
        <TrendingTopicsModal 
            isOpen={isTopicsModalOpen}
            onClose={() => setIsTopicsModalOpen(false)}
            isLoading={isTopicsLoading}
            topics={trendingTopics}
            error={topicsError}
            onSelectTopic={handleSelectTopic}
            onRetry={handleFetchTopics}
        />
      </div>
    </div>
  );
};

export default App;