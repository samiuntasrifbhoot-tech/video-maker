/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Film,
  Sparkles,
  Info,
  Heart,
  Video,
  HelpCircle,
  MessageSquareText,
  Play,
  Wand2
} from 'lucide-react';
import { INITIAL_SCENES } from './data';
import { VideoSettings, Scene } from './types';
import StoryboardPlayer from './components/StoryboardPlayer';
import AudioSynthesizer from './components/AudioSynthesizer';
import SceneEditor from './components/SceneEditor';
import SettingsPanel from './components/SettingsPanel';
import PresetManager from './components/PresetManager';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AiChatPanel from './components/AiChatPanel';
import { CinematicSynth } from './utils/audioSynth';

export default function App() {
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  
  // Synthesizer ref shared with AudioSynthesizer component
  const synthRef = useRef<CinematicSynth | null>(null);

  // Default settings
  const [settings, setSettings] = useState<VideoSettings>({
    aspectRatio: '9:16', // default vertical 9:16 for Reels/Shorts
    transitionStyle: 'crossfade',
    subtitleFontSize: 20,
    subtitleColor: '#ffffff',
    subtitleBgOpacity: 0.6,
    subtitlePosition: 'bottom',
    subtitleFontFamily: 'sans',
    subtitleAnimation: 'word-by-word',
    enableAmbientMusic: false,
    musicVolume: 0.4,
    enableVoiceover: true, // Let's enable voiceover by default to guide them!
    voiceoverType: 'gemini',
    voiceoverVoice: 'Kore',
    voiceoverRate: 1.0,
    voiceoverPitch: 1.0,
    voiceoverLang: 'bn-BD',
  });

  const setEnableMusic = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enableAmbientMusic: enabled }));
  };

  const setMusicVolume = (vol: number) => {
    setSettings((prev) => ({ ...prev, musicVolume: vol }));
  };

  const handleImportScenesFromAi = (importedScenes: Scene[]) => {
    setScenes(importedScenes);
    setCurrentSceneIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-aurora text-slate-100 selection:bg-amber-500/30 selection:text-amber-400">
      {/* Hide standard UI in Recording Mode */}
      {!isRecordingMode && (
        <header className="border-b border-slate-900/80 bg-slate-950/65 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/10">
                <Film className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-lg font-sans font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  সিনেমেটিক ইসলামিক স্টোরিবোর্ড মেকার
                  <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/20 font-bold font-mono">
                    PRO
                  </span>
                </h1>
                <p className="text-[11px] font-sans text-slate-400">
                  ইসলামিক শর্টস, রিলস এবং টিকটক ভিডিওর জন্য নিখুঁত অ্যানিমেটেড স্টোরিবোর্ড জেনারেটর
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Primary AI Chat Interface Trigger Button */}
              <button
                onClick={() => setIsAiChatOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-sans font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-current animate-pulse" />
                <span>✨ AI অ্যাসিস্ট্যান্ট ও রিল মেকার</span>
              </button>

              <PWAInstallPrompt />
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Banner with AI Assistant Callout */}
        {!isRecordingMode && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
            <div className="col-span-12 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900/90 border border-amber-500/30 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cinematic-glow">
              <div className="flex items-start gap-3.5 flex-1">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl text-slate-950 shrink-0 shadow-md shadow-amber-500/20">
                  <Wand2 className="w-5 h-5 fill-current" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-sans font-extrabold text-white text-sm flex items-center gap-2">
                    স্বয়ংক্রিয় AI ইসলামিক ভিডিও রিল মেকার
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                      NEW
                    </span>
                  </h3>
                  <p className="font-sans text-xs text-slate-300 leading-relaxed max-w-3xl">
                    যেকোনো ইসলামিক কাহিনীর নাম লিখুন (যেমন: <strong>"আসহাবে কাহাফের অলৌকিক ইতিহাস নিয়ে ৩০ সেকেন্ডের রিল বানান"</strong>)। AI স্বয়ংক্রিয়ভাবে স্ক্রিপ্ট, সিন স্প্লিটিং, ছবি, Gemini ভয়েসওভার এবং সরাসরি ডাউনলোডযোগ্য MP4 তৈরি করে দেবে!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAiChatOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-sans font-bold text-xs rounded-xl border border-amber-500/40 shrink-0 transition-all cursor-pointer hover:border-amber-400"
              >
                <MessageSquareText className="w-4 h-4 text-amber-400" />
                <span>AI চ্যাট ইন্টারফেস খুলুন</span>
              </button>
            </div>
          </div>
        )}

        {/* Workspace Layout Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isRecordingMode ? 'p-0 m-0' : ''}`}>
          {/* Main Left Section: Player & Music Synthesizer */}
          <div className={`${isRecordingMode ? 'col-span-12' : 'col-span-12 lg:col-span-6'} flex flex-col gap-6`}>
            <StoryboardPlayer
              scenes={scenes}
              currentSceneIndex={currentSceneIndex}
              setCurrentSceneIndex={setCurrentSceneIndex}
              settings={settings}
              setSettings={setSettings}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              isRecordingMode={isRecordingMode}
              setIsRecordingMode={setIsRecordingMode}
            />

            {!isRecordingMode && (
              <AudioSynthesizer
                currentSceneIndex={currentSceneIndex}
                enableMusic={settings.enableAmbientMusic}
                setEnableMusic={setEnableMusic}
                volume={settings.musicVolume}
                setVolume={setMusicVolume}
                synthRef={synthRef}
              />
            )}
          </div>

          {/* Right Section: Scene Editor, Styles, and Presets */}
          {!isRecordingMode && (
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
              {/* Tabs / Editors */}
              <SceneEditor
                scenes={scenes}
                setScenes={setScenes}
                currentSceneIndex={currentSceneIndex}
                setCurrentSceneIndex={setCurrentSceneIndex}
              />

              <SettingsPanel
                settings={settings}
                setSettings={setSettings}
                scenes={scenes}
                setScenes={setScenes}
              />

              <PresetManager
                scenes={scenes}
                setScenes={setScenes}
                setCurrentSceneIndex={setCurrentSceneIndex}
              />
            </div>
          )}
        </div>
      </main>

      {/* AI Chat Modal / Drawer */}
      <AiChatPanel
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        onImportScenes={handleImportScenesFromAi}
      />

      {/* Footer */}
      {!isRecordingMode && (
        <footer className="border-t border-slate-900 bg-slate-950 mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>তৈরি করা হয়েছে গভীর দায়িত্ববোধ ও ভালবাসা নিয়ে</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            </div>
            <div className="flex items-center gap-4">
              <span>© ২০২৬ সিনেমেটিক ইসলামিক স্টোরিবোর্ড মেকার</span>
              <span className="text-slate-600">|</span>
              <span className="hover:text-slate-300 cursor-pointer">ব্যবহার বিধি</span>
              <span className="text-slate-600">|</span>
              <span className="hover:text-slate-300 cursor-pointer">সাপোর্ট</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

