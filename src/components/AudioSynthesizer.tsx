/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music, HelpCircle } from 'lucide-react';
import { CinematicSynth } from '../utils/audioSynth';

interface AudioSynthesizerProps {
  currentSceneIndex: number;
  enableMusic: boolean;
  setEnableMusic: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  synthRef: React.MutableRefObject<CinematicSynth | null>;
}

export default function AudioSynthesizer({
  currentSceneIndex,
  enableMusic,
  setEnableMusic,
  volume,
  setVolume,
  synthRef,
}: AudioSynthesizerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Initialize synth on interaction
  const handleToggleMusic = () => {
    if (!synthRef.current) {
      synthRef.current = new CinematicSynth();
    }

    if (!isInitialized) {
      synthRef.current.init();
      synthRef.current.setVolume(volume);
      synthRef.current.setSceneChord(currentSceneIndex);
      setIsInitialized(true);
      setEnableMusic(true);
    } else {
      if (enableMusic) {
        synthRef.current.pause();
        setEnableMusic(false);
      } else {
        synthRef.current.resume();
        synthRef.current.setVolume(volume);
        synthRef.current.setSceneChord(currentSceneIndex);
        setEnableMusic(true);
      }
    }
  };

  // Synchronize chord with current scene index
  useEffect(() => {
    if (synthRef.current && isInitialized && enableMusic) {
      synthRef.current.setSceneChord(currentSceneIndex);
    }
  }, [currentSceneIndex, isInitialized, enableMusic]);

  // Synchronize volume
  useEffect(() => {
    if (synthRef.current && isInitialized) {
      synthRef.current.setVolume(enableMusic ? volume : 0);
    }
  }, [volume, enableMusic, isInitialized]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
        synthRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className={`w-5 h-5 ${enableMusic ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-sans font-medium text-slate-200 text-sm">সিনেমেটিক ব্যাকগ্রাউন্ড মিউজিক</span>
        </div>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 bottom-6 w-64 bg-slate-950 text-slate-300 text-xs p-3 rounded-lg border border-slate-800 shadow-xl z-50 leading-relaxed font-sans">
              এই ফিচারটি ব্রাউজারের <strong className="text-amber-400">Web Audio API</strong> ব্যবহার করে একটি রিয়েল-টাইম গভীর আধ্যাত্মিক ড্রোন প্যাড এবং মৃদু বাতাসের শব্দ সংশ্লেষণ (synthesize) করে। এটি কোনো অডিও ফাইল ডাউনলোড না করেই ভিডিওর মেজাজ ফুটিয়ে তোলে।
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleToggleMusic}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-xs font-semibold transition-all duration-300 ${
            enableMusic
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {enableMusic ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {enableMusic ? 'অডিও চালু আছে' : 'অডিও চালু করুন'}
        </button>

        {enableMusic && (
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">ভলিউম:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-750 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}
      </div>

      {enableMusic && (
        <div className="flex items-center gap-1.5 justify-center py-1">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-amber-500 rounded-full"
              style={{
                height: `${8 + Math.random() * 24}px`,
                animation: `bounce 0.8s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.1); }
        }
      `}</style>
    </div>
  );
}
