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
  Maximize2,
  Tv,
  Sparkles,
  Copy,
  Check,
  Download,
  Loader2,
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
  const [copied, setCopied] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generatedPromptText, setGeneratedPromptText] = useState('');
  const [isCanvasExporting, setIsCanvasExporting] = useState(false);
  const [exportPercent, setExportPercent] = useState(0);

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
  const words = currentScene.subtitle.trim().split(/\s+/).filter(Boolean);

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

  const playBrowserVoiceover = (scene: Scene) => {
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
        const charIndex = event.charIndex;
        const precedingText = text.substring(0, charIndex);
        const wordCount = precedingText.trim().split(/\s+/).filter(Boolean).length;
        setActiveWordIndex(wordCount);
      }
    };

    voiceoverRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger voiceover for individual scenes (when master full video audio is not used)
  const playSceneVoiceover = async (scene: Scene) => {
    stopVoiceover();

    // 1. Scene custom audio
    if (scene.voiceoverAudioUrl) {
      const audio = new Audio(scene.voiceoverAudioUrl);
      audio.volume = 1.0;
      customAudioRef.current = audio;

      if (isPlaying && countdown === null) {
        audio.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('কাস্টম ভয়েস প্লেব্যাক ব্যর্থ:', err);
          }
        });
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
          audio.play().catch((err) => {
            if (err.name !== 'AbortError') {
              console.error('Gemini ভয়েস প্লেব্যাক ব্যর্থ:', err);
            }
          });
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
            const cleanMime = (data.mimeType || 'audio/wav').split(';')[0].trim();
            const blob = new Blob([bytes], { type: cleanMime });
            const localUrl = URL.createObjectURL(blob);
            geminiAudioCacheRef.current[cacheKey] = localUrl;

            if (currentScene.id === scene.id && isPlaying && countdown === null) {
              const audio = new Audio(localUrl);
              audio.volume = 1.0;
              customAudioRef.current = audio;
              audio.play().catch((err) => {
                if (err.name !== 'AbortError') {
                  console.error('Gemini ভয়েস প্লেব্যাক ব্যর্থ:', err);
                  playBrowserVoiceover(scene);
                }
              });
            }
          } else {
            playBrowserVoiceover(scene);
          }
        } catch (err) {
          console.error('Gemini TTS error:', err);
          playBrowserVoiceover(scene);
        } finally {
          setIsGeneratingGlobalVoice(false);
        }
      }
      return;
    }

    // 3. Browser TTS
    playBrowserVoiceover(scene);
  };

  // Main playback loop & timing engine
  useEffect(() => {
    if (isPlaying && countdown === null) {
      // MODE A: SINGLE FULL VIDEO MASTER VOICE AUDIO
      if (settings.enableVoiceover && settings.fullVoiceoverUrl) {
        if (
          !customAudioRef.current ||
          customAudioRef.current.src !== settings.fullVoiceoverUrl
        ) {
          const masterAudio = new Audio(settings.fullVoiceoverUrl);
          masterAudio.volume = 1.0;
          customAudioRef.current = masterAudio;
        }

        const masterAudio = customAudioRef.current;
        if (masterAudio.paused) {
          masterAudio.play().catch((err) => console.error('Master audio play error:', err));
        }

        const updateMasterAudioProgress = () => {
          if (!masterAudio) return;

          const currentSec = masterAudio.currentTime || 0;
          const totalAudioSec = masterAudio.duration || settings.fullVoiceoverDuration || 30;

          // Compute scene ranges in seconds
          const totalSceneSec = scenes.reduce((sum, s) => sum + s.duration, 0);
          const scale = totalSceneSec / (totalAudioSec || 1);
          const mappedSec = currentSec * scale;

          let accumulated = 0;
          let matchedSceneIdx = 0;
          let sceneStartSec = 0;
          let sceneLenSec = scenes[0]?.duration || 5;

          for (let i = 0; i < scenes.length; i++) {
            const sDur = scenes[i].duration;
            if (mappedSec >= accumulated && mappedSec < accumulated + sDur) {
              matchedSceneIdx = i;
              sceneStartSec = accumulated;
              sceneLenSec = sDur;
              break;
            }
            accumulated += sDur;
            if (i === scenes.length - 1) {
              matchedSceneIdx = scenes.length - 1;
              sceneStartSec = accumulated - sDur;
              sceneLenSec = sDur;
            }
          }

          if (matchedSceneIdx !== currentSceneIndex) {
            setCurrentSceneIndex(matchedSceneIdx);
          }

          // Scene level progress
          const sceneElapsed = Math.max(0, mappedSec - sceneStartSec);
          const calculatedProgress = Math.min(100, Math.max(0, (sceneElapsed / sceneLenSec) * 100));
          setProgress(calculatedProgress);

          // Subtitle word glow indexing
          const curScene = scenes[matchedSceneIdx];
          const curWords = curScene.subtitle.trim().split(/\s+/).filter(Boolean);
          if (curWords.length > 0) {
            const wordRatio = sceneElapsed / sceneLenSec;
            const wordIdx = Math.floor(wordRatio * curWords.length);
            setActiveWordIndex(Math.min(Math.max(0, wordIdx), curWords.length - 1));
          } else {
            setActiveWordIndex(-1);
          }

          // Audio ended check
          if (masterAudio.ended || currentSec >= totalAudioSec) {
            masterAudio.pause();
            masterAudio.currentTime = 0;
            setIsPlaying(false);
            setCurrentSceneIndex(0);
            setProgress(0);
            setActiveWordIndex(-1);

            if (
              isRecording &&
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !== 'inactive'
            ) {
              mediaRecorderRef.current.stop();
            }
          } else {
            timerRef.current = setTimeout(updateMasterAudioProgress, 30);
          }
        };

        timerRef.current = setTimeout(updateMasterAudioProgress, 30);
      } else {
        // MODE B: SCENE BY SCENE AUDIO & TTS
        startTimeRef.current = Date.now() - elapsedTimeRef.current;

        if (elapsedTimeRef.current === 0) {
          playSceneVoiceover(currentScene);
        }

        if (customAudioRef.current && customAudioRef.current.paused) {
          customAudioRef.current
            .play()
            .catch((err) => console.error('Scene audio play error:', err));
        }

        const updateProgress = () => {
          const elapsed = Date.now() - startTimeRef.current;
          elapsedTimeRef.current = elapsed;

          const calculatedProgress = Math.min((elapsed / sceneDurationMs) * 100, 100);
          setProgress(calculatedProgress);

          // Word index timing
          const wordRatio = elapsed / sceneDurationMs;
          const wordIdx = Math.floor(wordRatio * words.length);
          setActiveWordIndex(Math.min(Math.max(0, wordIdx), words.length - 1));

          if (elapsed >= sceneDurationMs) {
            elapsedTimeRef.current = 0;
            setProgress(0);
            setActiveWordIndex(-1);

            if (currentSceneIndex < scenes.length - 1) {
              setCurrentSceneIndex(currentSceneIndex + 1);
            } else {
              if (
                isRecording &&
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state !== 'inactive'
              ) {
                mediaRecorderRef.current.stop();
              } else {
                setCurrentSceneIndex(0);
                setIsPlaying(false);
              }
            }
          } else {
            timerRef.current = setTimeout(updateProgress, 30);
          }
        };

        timerRef.current = setTimeout(updateProgress, 30);
      }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (customAudioRef.current) {
        customAudioRef.current.pause();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentSceneIndex, countdown, settings.enableVoiceover, settings.fullVoiceoverUrl, isRecording]);

  // Handle manual scene switch
  useEffect(() => {
    elapsedTimeRef.current = 0;
    setProgress(0);
    setActiveWordIndex(-1);

    if (settings.enableVoiceover && settings.fullVoiceoverUrl && customAudioRef.current) {
      const totalSceneSec = scenes.reduce((sum, s) => sum + s.duration, 0);
      const audioDuration = customAudioRef.current.duration || settings.fullVoiceoverDuration || 30;

      let sceneStartSec = 0;
      for (let i = 0; i < currentSceneIndex; i++) {
        sceneStartSec += scenes[i].duration;
      }

      const targetAudioSec = (sceneStartSec / totalSceneSec) * audioDuration;
      customAudioRef.current.currentTime = targetAudioSec;
    } else if (isPlaying) {
      playSceneVoiceover(currentScene);
    }
  }, [currentSceneIndex]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const startRecordingFlow = () => {
    setIsPlaying(false);
    setIsRecordingMode(true);
    setCountdown(3);
  };

  const handleCopyPrompt = () => {
    const scenesText = scenes
      .map((scene) => {
        return `Scene ${scene.sceneNumber}: "${scene.title}"
- Duration: ${scene.duration} seconds
- Bengali Subtitle/Script: "${scene.subtitle}"
- Motion Animation: ${scene.motionPreset} (e.g. pan, zoom, tilt)
- Recommended Image Visual Style: Create a highly detailed, cinematic, spiritual, and dramatic Islamic historical landscape or ambient visual representing "${scene.title}". Use cinematic, volumetric lighting, rich warm hues, gold or night skies, atmospheric dusty beams.`;
      })
      .join('\n\n');

    const detailedPrompt = `### ISLAMIC CINEMATIC STORYBOARD & ANIMATION GENERATION PROMPT ###
I want to generate a highly professional, cinematic short video/slideshow (Aspect Ratio: ${settings.aspectRatio}) for an Islamic story. Below is the structured scene-by-scene storyboard, script, and aesthetic guidelines to recreate this masterpiece in any AI Video Generation tool (like Runway, Kling, Sora, Luma, CapCut, or Premiere).

---
[AESTHETIC & GRAPHICS DIRECTION]
- Tone: Deeply spiritual, peaceful, emotional, cinematic, and epic.
- Lighting Style: Volumetric light rays, soft golden hour sunbursts, dramatic high-contrast dark slate backgrounds with warm glowing highlights.
- Graphic Feel: Premium, clean, modern, zero-clutter, with elegant high-legibility Bengali subtitle overlays.
- Transition Effects: ${settings.transitionStyle} style transitions (smooth, cinematic fade or zoom-fade).
- Background Music: Calming spiritual ambient backing track, deep string or native wind instruments.

---
[SCENE-BY-SCENE SEQUENCE DETAILS]
${scenesText}

---
[INSTRUCTIONS FOR THE GENERATION TOOL]
1. Use the "Bengali Subtitle/Script" for voiceover generation or captioned text overlays.
2. Animate each scene sequentially with the specified "Motion Animation" preset and "Duration".
3. Render the graphics with absolute cinematic realism, spiritual depth, and high artistic quality (no cartoony feel, strict realism/painting art).
`;

    setGeneratedPromptText(detailedPrompt);
    setShowPromptModal(true);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(detailedPrompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Screen recorder capture
  const startAutoRecording = async () => {
    // Check if running inside iframe or getDisplayMedia is not available in browser context
    const inIframe = window.self !== window.top;
    if (inIframe || !navigator?.mediaDevices?.getDisplayMedia) {
      console.warn('Screen recording is restricted inside preview frame or unsupported by current browser context.');
      setShowIframeWarning(true);
      return;
    }

    try {
      setIsPlaying(false);

      const captureStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = captureStream;
      recordedChunksRef.current = [];

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];

      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(
        captureStream,
        selectedMimeType ? { mimeType: selectedMimeType } : {}
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        try {
          const blob = new Blob(recordedChunksRef.current, {
            type: selectedMimeType || 'video/webm',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const safeTitle =
            scenes[0]?.title.substring(0, 15).replace(/\s+/g, '_') || 'islamic-video';
          a.download = `${safeTitle}-${Date.now()}.webm`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 200);
        } catch (downloadErr) {
          console.warn('ডাউনলোড ফাইল সেভ করার সংকেত:', downloadErr);
          setShowIframeWarning(true);
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);
        setIsPlaying(false);
        setIsRecordingMode(false);
      };

      setIsRecording(true);
      setIsRecordingMode(true);
      setCurrentSceneIndex(0);
      setProgress(0);
      elapsedTimeRef.current = 0;

      if (customAudioRef.current) {
        customAudioRef.current.currentTime = 0;
      }

      setCountdown(3);

      setTimeout(() => {
        recorder.start();
        setIsPlaying(true);
      }, 3000);
    } catch (err: any) {
      console.warn('ভিডিও রেকর্ড স্থগিত/বাতিল করা হয়েছে:', err?.message || err);
      setShowIframeWarning(true);
    }
  };

  // Canvas Direct Export Renderer
  const drawSceneToCanvas = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | null,
    scene: Scene,
    p: number,
    aspectRatio: '9:16' | '16:9',
    sceneIndex: number,
    totalScenes: number
  ) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Fill Canvas
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();

      let scale = 1.0;
      let dx = 0;
      let dy = 0;

      switch (scene.motionPreset) {
        case 'zoom-in':
          scale = 1.0 + p * 0.35;
          break;
        case 'zoom-out':
          scale = 1.35 - p * 0.35;
          break;
        case 'pan-left':
          scale = 1.25;
          dx = (0.08 - p * 0.16) * width;
          break;
        case 'pan-right':
          scale = 1.25;
          dx = (-0.08 + p * 0.16) * width;
          break;
        case 'tilt-up':
          scale = 1.25;
          dy = (0.08 - p * 0.16) * height;
          break;
        case 'tilt-down':
          scale = 1.25;
          dy = (-0.08 + p * 0.16) * height;
          break;
        default:
          scale = 1.0;
          break;
      }

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;
      let renderW = width;
      let renderH = height;

      if (imgAspect > canvasAspect) {
        renderH = height;
        renderW = height * imgAspect;
      } else {
        renderW = width;
        renderH = width / imgAspect;
      }

      const scaledW = renderW * scale;
      const scaledH = renderH * scale;

      const posX = (width - scaledW) / 2 + dx;
      const posY = (height - scaledH) / 2 + dy;

      ctx.drawImage(img, posX, posY, scaledW, scaledH);
      ctx.restore();
    }

    // Gradient Overlay
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0,0,0,0.4)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Top Badge
    const badgeW = 260;
    const badgeH = 40;
    const badgeX = (width - badgeW) / 2;
    const badgeY = 28;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 20);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`SCENE ${sceneIndex + 1} / ${totalScenes}`, width / 2, badgeY + badgeH / 2);

    // Subtitle Text Box
    if (scene.subtitle) {
      const textY = height - 120;
      let fontFamilyName = '"Hind Siliguri", sans-serif';
      if (settings.subtitleFontFamily === 'serif') fontFamilyName = '"Noto Serif Bengali", serif';
      else if (settings.subtitleFontFamily === 'anek') fontFamilyName = '"Anek Bangla", sans-serif';
      else if (settings.subtitleFontFamily === 'tiro') fontFamilyName = '"Tiro Bangla", serif';

      ctx.font = `bold 24px ${fontFamilyName}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const words = scene.subtitle.trim().split(/\s+/);
      let line = '';
      const lines: string[] = [];
      const maxW = width - 100;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxW && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      const lineHeight = 36;
      const padding = 18;
      const boxH = lines.length * lineHeight + padding * 2;
      const boxY = textY - boxH / 2;

      ctx.fillStyle = `rgba(15, 23, 42, ${settings.subtitleBgOpacity || 0.8})`;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(40, boxY, width - 80, boxH, 16);
      } else {
        ctx.rect(40, boxY, width - 80, boxH);
      }
      ctx.fill();

      ctx.fillStyle = settings.subtitleColor || '#ffffff';
      lines.forEach((l, idx) => {
        ctx.fillText(l.trim(), width / 2, boxY + padding + idx * lineHeight + lineHeight / 2);
      });
    }

    // Bottom Progress Line
    const overallProgress = (sceneIndex + p) / totalScenes;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, height - 10, width, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, height - 10, width * overallProgress, 10);
  };

  const handleCanvasExport = async () => {
    if (scenes.length === 0) return;

    setIsPlaying(false);
    setIsCanvasExporting(true);
    setExportPercent(0);

    try {
      const canvas = document.createElement('canvas');
      if (settings.aspectRatio === '9:16') {
        canvas.width = 720;
        canvas.height = 1280;
      } else {
        canvas.width = 1280;
        canvas.height = 720;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unsupported');

      // Preload images
      const preloadedImages: (HTMLImageElement | null)[] = await Promise.all(
        scenes.map(
          (scene) =>
            new Promise<HTMLImageElement | null>((resolve) => {
              if (!scene.imageUrl) {
                resolve(null);
                return;
              }
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null);
              img.src = scene.imageUrl;
            })
        )
      );

      const stream = canvas.captureStream(30);
      const recordedChunks: Blob[] = [];

      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(
        stream,
        selectedMime ? { mimeType: selectedMime } : {}
      );

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: selectedMime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = scenes[0]?.title.substring(0, 15).replace(/\s+/g, '_') || 'facebook_reel';
        a.download = `${safeTitle}-${Date.now()}.webm`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);

        setIsCanvasExporting(false);
        setExportPercent(100);
      };

      recorder.start();

      const fps = 30;
      const totalVideoSeconds = scenes.reduce((sum, s) => sum + s.duration, 0);
      const totalFrames = Math.ceil(totalVideoSeconds * fps);
      let currentFrame = 0;

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames) {
          recorder.stop();
          return;
        }

        let elapsed = currentFrame / fps;
        let sceneIdx = 0;
        let sceneProgress = 0;

        let acc = 0;
        for (let i = 0; i < scenes.length; i++) {
          const d = scenes[i].duration;
          if (elapsed <= acc + d || i === scenes.length - 1) {
            sceneIdx = i;
            sceneProgress = Math.min(1, Math.max(0, (elapsed - acc) / d));
            break;
          }
          acc += d;
        }

        const activeScene = scenes[sceneIdx];
        const activeImg = preloadedImages[sceneIdx];

        drawSceneToCanvas(
          ctx,
          activeImg,
          activeScene,
          sceneProgress,
          settings.aspectRatio,
          sceneIdx,
          scenes.length
        );

        currentFrame++;
        setExportPercent(Math.min(99, Math.round((currentFrame / totalFrames) * 100)));

        setTimeout(renderNextFrame, 1000 / fps);
      };

      renderNextFrame();
    } catch (err) {
      console.error('Canvas export error:', err);
      alert('ভিডিও এক্সপোর্ট করতে একটি সমস্যা হয়েছে।');
      setIsCanvasExporting(false);
    }
  };

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
        setCountdown(null);
        setCurrentSceneIndex(0);
        setIsPlaying(true);
      }
    }
  }, [countdown]);

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
      default:
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalVideoDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const elapsedVideoDuration =
    scenes.slice(0, currentSceneIndex).reduce((acc, s) => acc + s.duration, 0) +
    (progress / 100) * currentScene.duration;

  const fontClass =
    settings.subtitleFontFamily === 'serif'
      ? 'font-noto-serif'
      : settings.subtitleFontFamily === 'anek'
      ? 'font-anek'
      : settings.subtitleFontFamily === 'tiro'
      ? 'font-tiro'
      : 'font-hind';

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
                ২. এরপর সেই নতুন ট্যাব থেকে "ভিডিও ডাউনলোড" দিলে আপনার ব্রাউজার পরিষ্কারভাবে স্ক্রিন রেকর্ডিং ফাইল সেভ করতে দিবে।
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setShowIframeWarning(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🚀 সরাসরি নতুন ট্যাবে অ্যাপটি খুলুন</span>
              </button>
              <button
                type="button"
                onClick={() => setShowIframeWarning(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-sans font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating recording banner */}
      {isRecordingMode && (
        <div className="absolute top-4 left-4 z-50 bg-red-600/90 text-white font-sans text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-red-500 flex items-center gap-2 animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>রেকর্ডিং মোড চালু রয়েছে...</span>
          <span className="text-[10px] text-amber-200">
            (ESC চাপলে বন্ধ হবে)
          </span>
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

        {/* Master Voiceover Active Badge */}
        {settings.enableVoiceover && settings.fullVoiceoverUrl && (
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-amber-500/40 text-[10px] font-sans font-bold text-amber-400 px-3 py-1 rounded-full z-30 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            ১টি ভয়েস অডিও সিঙ্কড ({settings.fullVoiceoverName || 'Master Audio'})
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
                src={currentScene.imageUrl || null}
                alt={currentScene.title}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
                {...activeMotion}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Ambient Dark Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 pointer-events-none" />

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
            className={`px-4 py-2.5 rounded-xl transition-all max-w-[92%] leading-relaxed ${fontClass}`}
            style={{
              fontSize: `${settings.subtitleFontSize}px`,
              color: settings.subtitleColor,
              backgroundColor: `rgba(0, 0, 0, ${settings.subtitleBgOpacity})`,
              boxShadow: settings.subtitleBgOpacity > 0 ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {settings.subtitleAnimation === 'word-by-word' ? (
              <div className="text-center font-semibold leading-relaxed tracking-normal">
                {words.map((word, i) => {
                  const isActive = i === activeWordIndex;
                  return (
                    <span
                      key={i}
                      className={`transition-all duration-150 inline-block mr-1.5 ${
                        isActive
                          ? 'text-amber-300 font-extrabold scale-105'
                          : 'opacity-95 font-medium'
                      }`}
                      style={{
                        color: isActive ? '#fef08a' : settings.subtitleColor,
                        textShadow: isActive
                          ? '0 0 12px rgba(250, 204, 21, 0.95), 0 2px 6px rgba(0,0,0,0.95)'
                          : '0 2px 4px rgba(0,0,0,0.85)',
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
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
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/60 z-20">
          <div
            className="h-full bg-amber-500 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(245,158,11,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Control Dashboard Panel (Hidden in Recording Mode) */}
      {!isRecordingMode && (
        <div className="w-full max-w-3xl bg-slate-950/40 border border-slate-900/60 backdrop-blur-xl p-5 rounded-2xl mt-4 flex flex-col gap-4 cinematic-card-glow">
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
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-200"
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
                className="p-2 text-slate-300 hover:text-amber-500 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="পূর্ববর্তী দৃশ্য"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full transition-all duration-300 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
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
                className="p-2 text-slate-300 hover:text-amber-500 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="পরবর্তী দৃশ্য"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  if (customAudioRef.current) {
                    customAudioRef.current.currentTime = 0;
                  }
                  elapsedTimeRef.current = 0;
                  setProgress(0);
                  setActiveWordIndex(-1);
                  setIsPlaying(false);
                  setCurrentSceneIndex(0);
                }}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
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

            {/* Copy Prompt Button */}
            <button
              type="button"
              onClick={handleCopyPrompt}
              className={`flex items-center gap-2 px-4 py-2 font-sans font-bold text-xs rounded-lg transition-all duration-300 cursor-pointer border hover:scale-105 active:scale-95 shadow-md ${
                copied
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-amber-500/20'
                  : 'bg-slate-900 text-amber-400 border-amber-500/20 hover:border-amber-500/50 hover:bg-slate-850'
              }`}
              title="অন্যান্য এআই টুল ব্যবহারের জন্য সুন্দরভাবে সাজানো প্রম্পট কপি করুন"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 animate-bounce" />
                  প্রম্পট কপি হয়েছে!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  প্রম্পট কপি করুন (অন্য AI এর জন্য)
                </>
              )}
            </button>

            {/* 1-Click Direct Download Button */}
            <button
              type="button"
              onClick={handleCanvasExport}
              disabled={isCanvasExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-sans font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50"
              title="১-ক্লিকে কোন অনুমতি ছাড়াই রিলস ভিডিও সরাসরি ডাউনলোড করুন"
            >
              <Download className="w-4 h-4 text-slate-950" />
              ভিডিও ডাউনলোড (১-ক্লিক)
            </button>

            {/* Screen Record Alternative */}
            <button
              type="button"
              onClick={startAutoRecording}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-sans font-bold text-xs rounded-xl border border-slate-800 transition-all duration-300 cursor-pointer"
              title="ব্রাউজার স্ক্রিন ক্যাপচার মেথড"
            >
              <Video className="w-3.5 h-3.5 text-amber-500" />
              স্ক্রিন রেকর্ড ডাউনলোড
            </button>
          </div>
        </div>
      )}

      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-sans font-bold text-slate-100 text-lg">সিনেম্যাটিক এআই ভিডিও প্রম্পট</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              নিচের প্রম্পটটি কপি করে যেকোনো আধুনিক এআই ভিডিও মেকার (যেমন: <b>Runway, Kling, Sora, Luma, CapCut, Premiere</b>)-এ পেস্ট করুন। এটি আপনার পুরো স্টোরিবোর্ডের দৃশ্য, সাবটাইটেল এবং মোশন অনুযায়ী চমৎকার ভিডিও জেনারেট করবে।
            </p>

            {/* Scrollable Prompt View */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-60 overflow-y-auto">
              <pre className="text-[11px] text-amber-200/90 font-mono whitespace-pre-wrap leading-normal select-all">
                {generatedPromptText}
              </pre>
            </div>

            {/* Actions Inside Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 pt-4 mt-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-sans">অ্যাপ্লিকেশন লিংক বন্ধুদের সাথে শেয়ার করুন:</span>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] text-amber-400 font-mono select-all truncate max-w-[200px] sm:max-w-[280px]">
                    https://ais-pre-oouu5uwxq5n5cumnh4by4u-144333849655.asia-east1.run.app
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText('https://ais-pre-oouu5uwxq5n5cumnh4by4u-144333849655.asia-east1.run.app');
                      }
                      alert('শেয়ার করার লিংক কপি হয়েছে!');
                    }}
                    className="text-[10px] font-sans font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
                  >
                    কপি করুন
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(generatedPromptText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-bold rounded-xl border transition-all cursor-pointer ${
                    copied
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-slate-850 hover:bg-slate-800 text-amber-400 border-amber-500/20 hover:border-amber-500/50'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'প্রম্পট কপি হয়েছে!' : 'প্রম্পট কপি করুন'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPromptModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-xs font-sans font-bold rounded-xl transition-all cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Canvas Export Progress Modal */}
      {isCanvasExporting && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center animate-spin">
              <Loader2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-sans font-bold text-white text-base">
                রিলস ভিডিও তৈরি ও ডাউনলোড হচ্ছে...
              </h3>
              <p className="font-sans text-xs text-slate-400">
                ছবিগুলোর স্মুথ অ্যানিমেশন ও সাবটাইটেল হাই-কোয়ালিটিতে রেন্ডার করা হচ্ছে।
              </p>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-150"
                style={{ width: `${exportPercent}%` }}
              />
            </div>
            <span className="font-mono text-sm font-bold text-amber-400">
              {exportPercent}% সম্পন্ন
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
