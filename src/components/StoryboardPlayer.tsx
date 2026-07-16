/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Video,
  VideoOff,
  Maximize2,
  Tv,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Scene, VideoSettings } from '../types';

interface StoryboardPlayerProps {
  scenes: Scene[];
  currentSceneIndex: number;
  setCurrentSceneIndex: (index: number) => void;
  settings: VideoSettings;
  setSettings: React.Dispatch<React.SetStateAction<VideoSettings>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isRecordingMode: boolean;
  setIsRecordingMode: (recording: boolean) => void;
}

export default function StoryboardPlayer({
  scenes,
  currentSceneIndex,
  setCurrentSceneIndex,
  settings,
  setSettings,
  isPlaying,
  setIsPlaying,
  isRecordingMode,
  setIsRecordingMode,
}: StoryboardPlayerProps) {
  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const [progress, setProgress] = useState(0); // 0 to 100% of current scene
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [showIframeWarning, setShowIframeWarning] = useState(false);
  const [isGeneratingGlobalVoice, setIsGeneratingGlobalVoice] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const geminiAudioCacheRef = useRef<Record<string, string>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const voiceoverRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedTimeRef = useRef<number>(0); // in ms
  const sceneDurationMs = currentScene.duration * 1000;

  // Split subtitles for word-by-word timing
  const words = currentScene.subtitle.split(/\s+/);

  // Clean up any speaking voiceover or custom audio playback
  const stopVoiceover = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current = null;
    }
  };

  // Trigger voiceover for the current scene (either custom uploaded file, fallback speech synthesis, or Gemini AI TTS)
  const playVoiceover = async (scene: Scene) => {
    stopVoiceover();

    // 1. Play custom audio file if uploaded
    if (scene.voiceoverAudioUrl) {
      const audio = new Audio(scene.voiceoverAudioUrl);
      audio.volume = 1.0;
      customAudioRef.current = audio;

      if (isPlaying && countdown === null) {
        audio.play().catch((err) => console.error('কাস্টম ভয়েস প্লেব্যাক ব্যর্থ:', err));
      }
      return;
    }

    if (!settings.enableVoiceover) return;

    // 2. Play Gemini AI Voiceover
    if (settings.voiceoverType === 'gemini') {
      const cacheKey = `${scene.id}-${settings.voiceoverVoice}`;
      const cachedUrl = geminiAudioCacheRef.current[cacheKey];

      if (cachedUrl) {
        const audio = new Audio(cachedUrl);
        audio.volume = 1.0;
        customAudioRef.current = audio;
        if (isPlaying && countdown === null) {
          audio.play().catch((err) => console.error('Gemini ভয়েস প্লেব্যাক ব্যর্থ:', err));
        }
      } else {
        setIsGeneratingGlobalVoice(true);
        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: scene.subtitle, voice: settings.voiceoverVoice }),
          });
          const data = await response.json();
          if (response.ok && data.base64Audio) {
            const binary = atob(data.base64Audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/wav' });
            const localUrl = URL.createObjectURL(blob);
            geminiAudioCacheRef.current[cacheKey] = localUrl;

            // Only play if the scene hasn't changed while downloading
            if (currentScene.id === scene.id && isPlaying && countdown === null) {
              const audio = new Audio(localUrl);
              audio.volume = 1.0;
              customAudioRef.current = audio;
              audio.play().catch((err) => console.error('Gemini ভয়েস প্লেব্যাক ব্যর্থ:', err));
            }
          }
        } catch (err) {
          console.error('Gemini TTS generation failed:', err);
        } finally {
          setIsGeneratingGlobalVoice(false);
        }
      }
      return;
    }

    // 3. Play Web Speech Synthesis
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    const text = scene.subtitle;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find Bengali voice
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(
      (v) => v.lang.startsWith('bn') || v.lang.includes('Bengali')
    );
    
    if (bnVoice) {
      utterance.voice = bnVoice;
    }
    
    utterance.lang = 'bn-BD';
    utterance.rate = settings.voiceoverRate;
    utterance.pitch = settings.voiceoverPitch;
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Find the index of the word based on character index
        const charIndex = event.charIndex;
        const precedingText = text.substring(0, charIndex);
        const wordCount = precedingText.trim().split(/\s+/).filter(Boolean).length;
        setActiveWordIndex(wordCount);
      }
    };

    voiceoverRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Manage slideshow timer and animation loops
  useEffect(() => {
    if (isPlaying && countdown === null) {
      startTimeRef.current = Date.now() - elapsedTimeRef.current;
      
      // Voiceover triggers on scene start
      if (elapsedTimeRef.current === 0) {
        playVoiceover(currentScene);
      }

      // Resume custom audio playback if paused
      if (customAudioRef.current && customAudioRef.current.paused) {
        customAudioRef.current.play().catch((err) => console.error('কাস্টম ভয়েস প্লেব্যাক ব্যর্থ:', err));
      }

      const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        elapsedTimeRef.current = elapsed;
        
        const calculatedProgress = Math.min((elapsed / sceneDurationMs) * 100, 100);
        setProgress(calculatedProgress);

        // Update active word index based on time ratio (for both custom audio and system voiceover)
        const wordRatio = elapsed / sceneDurationMs;
        const wordIdx = Math.floor(wordRatio * words.length);
        setActiveWordIndex(Math.min(wordIdx, words.length - 1));

        if (elapsed >= sceneDurationMs) {
          // Scene finished! Go to next scene or loop
          elapsedTimeRef.current = 0;
          setProgress(0);
          setActiveWordIndex(-1);
          
          if (currentSceneIndex < scenes.length - 1) {
            setCurrentSceneIndex(currentSceneIndex + 1);
          } else {
            // End of storyboard! If recording, stop and download
            if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            } else {
              setCurrentSceneIndex(0);
            }
          }
        } else {
          timerRef.current = setTimeout(updateProgress, 30);
        }
      };

      timerRef.current = setTimeout(updateProgress, 30);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      stopVoiceover();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentSceneIndex, countdown, settings.enableVoiceover, isRecording]);

  // Handle manual scene shift
  useEffect(() => {
    elapsedTimeRef.current = 0;
    setProgress(0);
    setActiveWordIndex(-1);
    if (isPlaying) {
      playVoiceover(currentScene);
    }
  }, [currentSceneIndex]);

  // Voiceover list loader (to make sure voices are ready)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Manage countdown for Screen Recording Mode
  const startRecordingFlow = () => {
    setIsPlaying(false);
    setIsRecordingMode(true);
    setCountdown(3);
  };

  // Start automatic screen and audio recording and download flow
  const startAutoRecording = async () => {
    try {
      setIsPlaying(false);
      
      // Request clean capture of screen/tab containing system audio
      const captureStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      streamRef.current = captureStream;
      recordedChunksRef.current = [];

      let recorder: MediaRecorder;
      // Try to record in highly compressed and universally playable video container
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      recorder = new MediaRecorder(captureStream, selectedMimeType ? { mimeType: selectedMimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Generate nice custom file name based on first scene's title
        const safeTitle = scenes[0]?.title.substring(0, 15).replace(/\s+/g, '_') || 'islamic-video';
        a.download = `${safeTitle}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Cleanup streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        setIsPlaying(false);
        setIsRecordingMode(false);
      };

      // Set state to recording mode
      setIsRecording(true);
      setIsRecordingMode(true);
      setCurrentSceneIndex(0);
      setProgress(0);
      elapsedTimeRef.current = 0;
      
      // Start 3 second countdown
      setCountdown(3);

      setTimeout(() => {
        recorder.start();
        setIsPlaying(true);
      }, 3000);

    } catch (err) {
      console.error('ভিডিও রেকর্ডিং আরম্ভ করা যায়নি:', err);
      setShowIframeWarning(true);
    }
  };

  // Clean up references on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (customAudioRef.current) {
        customAudioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // Countdown finished, start play
        setCountdown(null);
        setCurrentSceneIndex(0);
        setIsPlaying(true);
      }
    }
  }, [countdown]);

  // Keyboard support to escape Recording mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isRecordingMode) {
        setIsRecordingMode(false);
        setIsPlaying(false);
        setCountdown(null);
        stopVoiceover();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecordingMode]);

  // Motion config generator for Ken Burns effects
  const getMotionConfig = (preset: typeof currentScene.motionPreset) => {
    const duration = currentScene.duration;
    switch (preset) {
      case 'zoom-in':
        return {
          initial: { scale: 1.0, x: 0, y: 0 },
          animate: { scale: 1.18, x: 0, y: 0 },
          transition: { duration, ease: 'linear' },
        };
      case 'zoom-out':
        return {
          initial: { scale: 1.18, x: 0, y: 0 },
          animate: { scale: 1.0, x: 0, y: 0 },
          transition: { duration, ease: 'linear' },
        };
      case 'pan-left':
        return {
          initial: { scale: 1.15, x: '5%', y: 0 },
          animate: { scale: 1.15, x: '-5%', y: 0 },
          transition: { duration, ease: 'linear' },
        };
      case 'pan-right':
        return {
          initial: { scale: 1.15, x: '-5%', y: 0 },
          animate: { scale: 1.15, x: '5%', y: 0 },
          transition: { duration, ease: 'linear' },
        };
      case 'tilt-up':
        return {
          initial: { scale: 1.15, x: 0, y: '5%' },
          animate: { scale: 1.15, x: 0, y: '-5%' },
          transition: { duration, ease: 'linear' },
        };
      case 'tilt-down':
        return {
          initial: { scale: 1.15, x: 0, y: '-5%' },
          animate: { scale: 1.15, x: 0, y: '5%' },
          transition: { duration, ease: 'linear' },
        };
      default:
        return {
          initial: { scale: 1.0, x: 0, y: 0 },
          animate: { scale: 1.0, x: 0, y: 0 },
          transition: { duration, ease: 'linear' },
        };
    }
  };

  // Get Transition Animation configuration
  const getTransitionConfig = () => {
    switch (settings.transitionStyle) {
      case 'slide-left':
        return {
          initial: { opacity: 0, x: '100%' },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: '-100%' },
          transition: { duration: 0.8, ease: 'easeInOut' },
        };
      case 'dip-to-black':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 1.0, ease: 'easeIn' },
        };
      case 'zoom-fade':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.1 },
          transition: { duration: 0.8, ease: 'easeInOut' },
        };
      default: // crossfade
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.8 },
        };
    }
  };

  const activeMotion = getMotionConfig(currentScene.motionPreset);
  const transitionConfig = getTransitionConfig();

  // Helper formatting for seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalVideoDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const elapsedVideoDuration =
    scenes.slice(0, currentSceneIndex).reduce((acc, s) => acc + s.duration, 0) +
    (progress / 100) * currentScene.duration;

  // Font style logic
  const fontClass =
    settings.subtitleFontFamily === 'serif' ? 'font-serif' : 'font-sans';

  // Subtitle position styles
  const positionClasses = {
    top: 'top-10 bottom-auto justify-start',
    middle: 'top-1/2 -translate-y-1/2 justify-center',
    bottom: 'bottom-12 top-auto justify-end',
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center ${
        isRecordingMode ? 'fixed inset-0 w-full h-full bg-black z-50 p-4' : 'w-full'
      }`}
    >
      {/* Iframe warning modal */}
      {showIframeWarning && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 animate-fade-in pointer-events-auto">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h3 className="font-sans font-bold text-slate-100 text-lg">নিরাপত্তা সতর্কবার্তা (Iframe Protection)</h3>
            <p className="font-sans text-xs text-slate-400 leading-relaxed">
              দুঃখিত! ব্রাউজারের নিরাপত্তার কারণে এই প্রিভিউ উইন্ডো বা আইফ্রেম (Iframe) থেকে সরাসরি ভিডিও রেকর্ড বা ডাউনলোড করা সম্ভব নয়।
            </p>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-left flex flex-col gap-2">
              <span className="text-[11px] font-sans font-semibold text-amber-400">সমাধান করতে নিচের নিয়মটি অনুসরণ করুন:</span>
              <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                ১. স্ক্রিনের উপরের ডান কোনায় <strong className="text-white">"Open in new tab" (নতুন ট্যাবে খুলুন)</strong> বোতামে ক্লিক করে অ্যাপটি নতুন ট্যাবে ওপেন করুন।
              </p>
              <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                ২. সেখানে এই ডাউনলোড বা ম্যানুয়াল রেকর্ড অপশনটি ব্যবহার করুন। এটি ১০০% কাজ করবে!
              </p>
            </div>
            <button
              onClick={() => setShowIframeWarning(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-sans font-bold rounded-xl transition-all active:scale-95 text-xs cursor-pointer"
            >
              আমি বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}

      {/* Floating Exit Button for Recording Mode */}
      {isRecordingMode && (
        <button
          onClick={() => {
            setIsRecordingMode(false);
            setIsPlaying(false);
            setCountdown(null);
            stopVoiceover();
          }}
          className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-xs px-3.5 py-2 rounded-lg z-50 shadow-xl cursor-pointer"
        >
          রেকর্ডিং বন্ধ করুন (Exit)
        </button>
      )}

      {/* Recording Tips overlay */}
      {isRecordingMode && countdown === null && (
        <div className="absolute top-4 left-4 right-20 flex items-center justify-between text-xs text-slate-400 font-sans z-40 bg-black/80 backdrop-blur px-4 py-2.5 rounded-lg pointer-events-none border border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
            {isRecording ? (
              <span className="text-emerald-400 font-medium">
                অটোমেটিক ডাউনলোড রেকর্ডিং চলছে... শেষ দৃশ্য পর্যন্ত অপেক্ষা করুন
              </span>
            ) : (
              <span>রেকর্ডিং মোড সক্রিয় (আপনার স্ক্রিন রেকর্ডার চালু করে রেকর্ড করুন)</span>
            )}
          </span>
          <span>বাহির হতে <strong className="text-amber-400 font-mono">ESC</strong> চাপুন</span>
        </div>
      )}

      {/* Countdown modal */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={countdown}
            className="text-amber-500 font-mono text-9xl font-black"
          >
            {countdown}
          </motion.div>
          <p className="font-sans text-lg text-slate-300 mt-6 animate-pulse">
            ভিডিও ধারণ শুরু হচ্ছে... প্রস্তুত হোন
          </p>
        </div>
      )}

      {/* Main Video Screen Container */}
      <div
        className={`relative overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-500 flex items-center justify-center ${
          settings.aspectRatio === '9:16'
            ? 'aspect-[9/16] w-[380px] max-w-full rounded-2xl cinematic-glow'
            : 'aspect-[16/9] w-full max-w-3xl rounded-2xl cinematic-glow'
        }`}
        id="cinematic-canvas"
      >
        {/* Gemini Voice Loading Indicator */}
        {isGeneratingGlobalVoice && (
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 text-[11px] font-sans font-bold text-amber-400 px-3 py-1.5 rounded-full z-30 flex items-center gap-1.5 shadow-lg animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Gemini AI ভয়েস তৈরি হচ্ছে...
          </div>
        )}

        {/* Background transition wrapper */}
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id}
              className="absolute inset-0 w-full h-full"
              {...transitionConfig}
            >
              <motion.img
                key={`${currentScene.id}-image`}
                src={currentScene.imageUrl}
                alt={currentScene.title}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
                {...activeMotion}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Ambient Dark Overlay to make subtitles readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

        {/* Cinematic Letterbox for 16:9 */}
        {settings.aspectRatio === '16:9' && (
          <>
            <div className="absolute top-0 left-0 right-0 h-6 bg-black pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-black pointer-events-none" />
          </>
        )}

        {/* Subtitles Overlay */}
        <div
          className={`absolute left-4 right-4 flex flex-col items-center text-center pointer-events-none ${
            positionClasses[settings.subtitlePosition]
          }`}
        >
          <div
            className={`px-4 py-2.5 rounded-xl transition-all max-w-[90%] leading-relaxed ${fontClass}`}
            style={{
              fontSize: `${settings.subtitleFontSize}px`,
              color: settings.subtitleColor,
              backgroundColor: `rgba(0, 0, 0, ${settings.subtitleBgOpacity})`,
              boxShadow: settings.subtitleBgOpacity > 0 ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {settings.subtitleAnimation === 'word-by-word' ? (
              <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                {words.map((word, i) => (
                  <span
                    key={i}
                    className={`transition-all duration-150 inline-block ${
                      i === activeWordIndex
                        ? 'scale-110 font-bold drop-shadow-md text-yellow-450'
                        : 'font-medium'
                    }`}
                    style={{
                      color: i === activeWordIndex ? '#facc15' : settings.subtitleColor,
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            ) : settings.subtitleAnimation === 'fade-in' ? (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentSceneIndex}
                className="inline-block text-shadow-custom"
              >
                {currentScene.subtitle}
              </motion.span>
            ) : (
              <span className="text-shadow-custom inline-block">{currentScene.subtitle}</span>
            )}
          </div>
        </div>

        {/* Small floating scene indicator */}
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-[11px] font-mono font-bold text-amber-500 px-2.5 py-1 rounded-full z-10">
          SCENE {currentScene.sceneNumber} / {scenes.length}
        </div>

        {/* Small Progress Bar inside canvas (Bottom edge) */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60 z-20">
          <div
            className="h-full bg-amber-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Control Dashboard Panel (Hidden in Recording Mode) */}
      {!isRecordingMode && (
        <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 p-4 rounded-xl mt-4 flex flex-col gap-3 cinematic-glow">
          {/* Timeline and status bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              <span className="text-xs text-slate-300 font-sans font-medium">
                {currentScene.title}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {formatTime(elapsedVideoDuration)} / {formatTime(totalVideoDuration)}
            </div>
          </div>

          {/* Scrubber indicator */}
          <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
              style={{
                width: `${
                  ((scenes.slice(0, currentSceneIndex).reduce((acc, s) => acc + s.duration, 0) +
                    (progress / 100) * currentScene.duration) /
                    totalVideoDuration) *
                  100
                }%`,
              }}
            />
          </div>

          {/* Control Buttons row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentSceneIndex > 0) {
                    setCurrentSceneIndex(currentSceneIndex - 1);
                  } else {
                    setCurrentSceneIndex(scenes.length - 1);
                  }
                }}
                className="p-2 text-slate-300 hover:text-amber-500 hover:bg-slate-800 rounded-lg transition-colors"
                title="পূর্ববর্তী দৃশ্য"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full transition-all duration-300 shadow-lg shadow-amber-500/20 active:scale-95"
                title={isPlaying ? 'বিরতি দিন' : 'চালু করুন'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                onClick={() => {
                  if (currentSceneIndex < scenes.length - 1) {
                    setCurrentSceneIndex(currentSceneIndex + 1);
                  } else {
                    setCurrentSceneIndex(0);
                  }
                }}
                className="p-2 text-slate-300 hover:text-amber-500 hover:bg-slate-800 rounded-lg transition-colors"
                title="পরবর্তী দৃশ্য"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  elapsedTimeRef.current = 0;
                  setProgress(0);
                  setActiveWordIndex(-1);
                  setIsPlaying(false);
                  setCurrentSceneIndex(0);
                }}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="পুনরায় শুরু"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Quick layout controls */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">ভিডিও অনুপাত:</span>
              <button
                onClick={() => setSettings((prev) => ({ ...prev, aspectRatio: '9:16' }))}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors ${
                  settings.aspectRatio === '9:16'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="TikTok / Shorts / Reels"
              >
                <Video className="w-3.5 h-3.5" />
                ৯:১৬ (উল্লম্ব)
              </button>
              <button
                onClick={() => setSettings((prev) => ({ ...prev, aspectRatio: '16:9' }))}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors ${
                  settings.aspectRatio === '16:9'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="YouTube / Facebook Video"
              >
                <Tv className="w-3.5 h-3.5" />
                ১৬:৯ (আনুভূমিক)
              </button>
            </div>

            {/* Direct Auto Download Button */}
            <button
              type="button"
              onClick={startAutoRecording}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-sans font-bold text-xs rounded-lg shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              title="পুরো স্টোরিবোর্ডটি স্বয়ংক্রিয়ভাবে রেকর্ড করে সরাসরি ডাউনলোড করুন"
            >
              <Video className="w-4 h-4" />
              ভিডিও ডাউনলোড (অটো)
            </button>

            {/* Fullscreen Recording Button */}
            <button
              onClick={startRecordingFlow}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-sans font-bold shadow-lg shadow-red-600/10 transition-all duration-300 animate-pulse hover:animate-none"
            >
              <Maximize2 className="w-4 h-4" />
              ম্যানুয়াল রেকর্ড
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
