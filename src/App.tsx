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
} from 'lucide-react';
import { INITIAL_SCENES } from './data';
import { VideoSettings, Scene } from './types';
import StoryboardPlayer from './components/StoryboardPlayer';
import AudioSynthesizer from './components/AudioSynthesizer';
import SceneEditor from './components/SceneEditor';
import SettingsPanel from './components/SettingsPanel';
import PresetManager from './components/PresetManager';
import { CinematicSynth } from './utils/audioSynth';

export default function App() {
  const [scenes, setScenes] = useState<Scene[]>(INITIAL_SCENES);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500/30 selection:text-amber-400">
      {/* Hide standard UI in Recording Mode */}
      {!isRecordingMode && (
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
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

            <div className="flex items-center gap-2 text-xs text-slate-400 font-sans bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>মুসাফির খলিফা সিরিজ • হযরত উমর (রা:)</span>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Hide instructions guide during full screen presentation */}
        {!isRecordingMode && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between cinematic-glow">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-sans font-bold text-slate-100 text-sm">
                    শর্টস ও রিলস ভিডিও তৈরি করার সহজ গাইড:
                  </h3>
                  <p className="font-sans text-xs text-slate-400 leading-relaxed max-w-4xl">
                    ১. স্ক্রিপ্ট বা দৃশ্য পরিবর্তন করতে <strong>দৃশ্য এডিটর</strong> ব্যবহার করুন অথবা ছবি আপলোড করুন। ২. সাবটাইটেলের হরফ কালার ও পজিশন কাস্টমাইজ করুন। ৩. <strong>রেকর্ডিং মোড</strong> বোতামে চাপুন। ৪. আপনার স্ক্রিন রেকর্ডার (OBS/Loom/মোবাইল রেকর্ডার) চালু করুন এবং পুরো ভিডিওটি রেকর্ড করে রিলস বা টিকটক আকারে প্রকাশ করুন!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-sans text-xs font-semibold text-amber-500">
                <Video className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>ভিডিও বানানোর জন্য সম্পূর্ণ উপযোগী!</span>
              </div>
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

              <SettingsPanel settings={settings} setSettings={setSettings} />

              <PresetManager
                scenes={scenes}
                setScenes={setScenes}
                setCurrentSceneIndex={setCurrentSceneIndex}
              />
            </div>
          )}
        </div>
      </main>

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
