/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Type,
  Sparkles,
  Mic,
  Palette,
  Layout,
  Upload,
  FileAudio,
  Trash2,
  RefreshCw,
  Check,
} from 'lucide-react';
import { VideoSettings, Scene } from '../types';
import AccordionSection from './AccordionSection';

interface SettingsPanelProps {
  settings: VideoSettings;
  setSettings: React.Dispatch<React.SetStateAction<VideoSettings>>;
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
}

export default function SettingsPanel({
  settings,
  setSettings,
  scenes,
  setScenes,
}: SettingsPanelProps) {
  const [isGeneratingFullGemini, setIsGeneratingFullGemini] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const subtitleColors = [
    { name: 'সাদা', value: '#ffffff' },
    { name: 'হলুদ', value: '#facc15' },
    { name: 'সোনালী', value: '#f59e0b' },
    { name: 'হালকা সবুজ', value: '#4ade80' },
    { name: 'কমলা', value: '#fb923c' },
  ];

  const updateSetting = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Helper to auto-sync scenes duration proportionally based on subtitle word lengths to match target audio duration
  const autoSyncSceneDurations = (totalAudioSec: number, scenesList: Scene[] = scenes) => {
    if (!totalAudioSec || totalAudioSec <= 0 || scenesList.length === 0) return;

    const wordCounts = scenesList.map(
      (s) => s.subtitle.trim().split(/\s+/).filter(Boolean).length
    );
    const totalWords = wordCounts.reduce((a, b) => a + b, 0);

    let updatedScenes: Scene[];

    if (totalWords === 0) {
      const perSceneSec = Math.max(2, Math.round((totalAudioSec / scenesList.length) * 10) / 10);
      updatedScenes = scenesList.map((s) => ({ ...s, duration: perSceneSec }));
    } else {
      let accumulatedSec = 0;
      updatedScenes = scenesList.map((s, idx) => {
        if (idx === scenesList.length - 1) {
          // Give remaining time to last scene
          const remaining = Math.max(2, Math.round((totalAudioSec - accumulatedSec) * 10) / 10);
          return { ...s, duration: remaining };
        }
        const wCount = wordCounts[idx] || 1;
        const calcDuration = Math.max(2, Math.round((totalAudioSec * (wCount / totalWords)) * 10) / 10);
        accumulatedSec += calcDuration;
        return { ...s, duration: calcDuration };
      });
    }

    setScenes(updatedScenes);
  };

  // Handle uploading a master single voiceover audio for the whole video
  const handleFullVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(objectUrl);

    tempAudio.onloadedmetadata = () => {
      const durationSec = Math.round(tempAudio.duration) || 30;
      setSettings((prev) => ({
        ...prev,
        enableVoiceover: true,
        voiceoverType: 'custom-full',
        fullVoiceoverUrl: objectUrl,
        fullVoiceoverName: file.name,
        fullVoiceoverDuration: durationSec,
      }));

      // Automatically sync scene durations to match audio length
      autoSyncSceneDurations(durationSec);
    };
  };

  // Generate Gemini TTS for the ENTIRE story text at once
  const handleGenerateFullGeminiAudio = async () => {
    const fullText = scenes.map((s) => s.subtitle).filter(Boolean).join('. ');
    if (!fullText.trim()) return;

    setIsGeneratingFullGemini(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText, voice: settings.voiceoverVoice }),
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

        const tempAudio = new Audio(localUrl);
        tempAudio.onloadedmetadata = () => {
          const durationSec = Math.round(tempAudio.duration) || 30;
          setSettings((prev) => ({
            ...prev,
            enableVoiceover: true,
            voiceoverType: 'custom-full',
            fullVoiceoverUrl: localUrl,
            fullVoiceoverName: `Gemini_Full_Story_${settings.voiceoverVoice}.mp3`,
            fullVoiceoverDuration: durationSec,
          }));

          autoSyncSceneDurations(durationSec);
        };
      } else {
        alert('Gemini ভয়েস জেনারেট করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }
    } catch (err) {
      console.error('Full Gemini TTS failed:', err);
      alert('ভয়েস জেনারেট করার সময়ে সমস্যা হয়েছে।');
    } finally {
      setIsGeneratingFullGemini(false);
    }
  };

  const removeFullVoiceover = () => {
    setSettings((prev) => ({
      ...prev,
      voiceoverType: 'gemini',
      fullVoiceoverUrl: undefined,
      fullVoiceoverName: undefined,
      fullVoiceoverDuration: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-5 bg-slate-950/40 border border-slate-900/60 backdrop-blur-xl p-5 rounded-2xl cinematic-card-glow">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
        <Palette className="w-5 h-5 text-amber-500" />
        <h2 className="font-sans font-bold text-slate-100 text-base">ভিডিও ও সাবটাইটেল সেটিংস</h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* SECTION 1: Subtitle Style Editor */}
        <AccordionSection
          title="সাবটাইটেল ফন্ট, কালার ও স্টাইল এডিটর"
          subtitle="বাংলা ফন্ট, টেক্সট কালার, সাইজ ও পজিশন পরিবর্তন করুন"
          icon={<Type className="w-4 h-4 text-amber-500" />}
          defaultOpen={false}
        >
          <div className="flex flex-col gap-4">
            {/* Subtitle Color Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-sans font-semibold">সাবটাইটেল কালার:</label>
              <div className="flex flex-wrap gap-2">
                {subtitleColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateSetting('subtitleColor', color.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans border transition-all duration-300 cursor-pointer ${
                      settings.subtitleColor === color.value
                        ? 'bg-slate-800 text-slate-100 border-amber-500 font-bold'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Pairings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Font Family */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs text-slate-400 font-sans font-semibold">
                  বাংলা সাবটাইটেল ফন্ট (Bengali Fonts):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'sans', label: 'Hind Siliguri', fontClass: 'font-hind', desc: 'মডার্ন ক্লিন' },
                    { id: 'serif', label: 'Noto Serif Bengali', fontClass: 'font-noto-serif', desc: 'ক্ল্যাসিক সিগনেচার' },
                    { id: 'anek', label: 'Anek Bangla', fontClass: 'font-anek', desc: 'বোল্ড স্টাইলিশ' },
                    { id: 'tiro', label: 'Tiro Bangla', fontClass: 'font-tiro', desc: 'ঐতিহ্যবাহী ট্রেডিশনাল' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateSetting('subtitleFontFamily', f.id)}
                      className={`flex flex-col items-start px-3 py-2.5 rounded-xl text-xs border transition-all cursor-pointer ${
                        settings.subtitleFontFamily === f.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <span className={`text-sm ${f.fontClass}`}>অ আ ক খ (আকাঙ্ক্ষা)</span>
                      <span className="text-[11px] font-bold mt-0.5">{f.label}</span>
                      <span className="text-[9px] text-slate-400 opacity-80">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle Position */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs text-slate-400 font-sans font-semibold">স্ক্রিন অবস্থান (Position):</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'bottom', label: 'নিচে (Bottom)' },
                    { id: 'middle', label: 'মাঝে (Middle)' },
                    { id: 'top', label: 'উপরে (Top)' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => updateSetting('subtitlePosition', pos.id as VideoSettings['subtitlePosition'])}
                      className={`px-2 py-2 rounded-xl text-xs font-sans border text-center transition-all cursor-pointer ${
                        settings.subtitlePosition === pos.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subtitle Animation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-sans font-semibold">সাবটাইটেল মোড / অ্যানিমেশন ইফেক্ট:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'word-by-word', label: 'অটো হাইলাইট গ্লো', desc: 'TikTok/Reels Word Highlight' },
                  { id: 'fade-in', label: 'ধীরে প্রকাশ', desc: 'Cinematic Fade-In' },
                  { id: 'none', label: 'সাধারণ প্রদর্শন', desc: 'Static Subtitle' },
                ].map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => updateSetting('subtitleAnimation', anim.id as VideoSettings['subtitleAnimation'])}
                    className={`flex flex-col items-start px-3 py-2 rounded-xl text-xs font-sans border text-left transition-all cursor-pointer ${
                      settings.subtitleAnimation === anim.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-xs">{anim.label}</span>
                    <span className="text-[10px] text-slate-400 opacity-80">{anim.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Font Size */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-sans flex justify-between">
                  <span>ফন্ট সাইজ:</span>
                  <span className="font-mono text-[10px] text-amber-500 font-bold">
                    {settings.subtitleFontSize}px
                  </span>
                </label>
                <input
                  type="range"
                  min="14"
                  max="36"
                  step="1"
                  value={settings.subtitleFontSize}
                  onChange={(e) => updateSetting('subtitleFontSize', parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              {/* Background Opacity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-sans flex justify-between">
                  <span>ব্যাকগ্রাউন্ড অস্বচ্ছতা:</span>
                  <span className="font-mono text-[10px] text-amber-500 font-bold">
                    {Math.round(settings.subtitleBgOpacity * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.subtitleBgOpacity}
                  onChange={(e) => updateSetting('subtitleBgOpacity', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* SECTION 2: Transition Style Selector */}
        <AccordionSection
          title="দৃশ্যের ট্রানজিশন ইফেক্ট (Transitions)"
          subtitle="এক দৃশ্য থেকে অন্য দৃশ্যে পরিবর্তনের এনিমেশন"
          icon={<Layout className="w-4 h-4 text-amber-500" />}
          badge={settings.transitionStyle}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'crossfade', label: 'ক্রসফেড', desc: 'Crossfade' },
              { id: 'slide-left', label: 'স্লাইড', desc: 'Slide Left' },
              { id: 'dip-to-black', label: 'ব্ল্যাক ফেড', desc: 'Dip to Black' },
              { id: 'zoom-fade', label: 'জুম ফেড', desc: 'Zoom & Fade' },
            ].map((tr) => (
              <button
                key={tr.id}
                type="button"
                onClick={() => updateSetting('transitionStyle', tr.id as VideoSettings['transitionStyle'])}
                className={`flex flex-col items-center px-2 py-2 rounded-xl text-xs font-sans border text-center transition-all cursor-pointer ${
                  settings.transitionStyle === tr.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span>{tr.label}</span>
                <span className="text-[10px] text-slate-400 opacity-80">{tr.desc}</span>
              </button>
            ))}
          </div>
        </AccordionSection>

        {/* SECTION 3: Full Master Audio & Voiceover Section */}
        <AccordionSection
          title="সম্পূর্ণ ভিডিওর মাস্টার ভয়েসওভার"
          subtitle="পুরো ভিডিওর জন্য ১টি প্রধান অডিও অথবা Gemini AI ভয়েস"
          icon={<Mic className="w-4 h-4 text-amber-500" />}
          badge={settings.enableVoiceover ? 'অন' : 'অফ'}
          defaultOpen={false}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-sans text-slate-300 font-bold flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-amber-500" />
                ভিডিওতে ভয়েসওভার চালু রাখুন:
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableVoiceover}
                  onChange={(e) => updateSetting('enableVoiceover', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-950"></div>
              </label>
            </div>

            {settings.enableVoiceover && (
              <div className="flex flex-col gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {/* Voiceover Engine Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400 font-sans font-semibold">
                    ভয়েস মোড নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('voiceoverType', 'custom-full')}
                      className={`px-2 py-2.5 rounded-lg text-[11px] font-sans font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${
                        settings.voiceoverType === 'custom-full'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/60 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <FileAudio className="w-4 h-4 text-amber-500" />
                      <span>১টি অডিও (Master Upload)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('voiceoverType', 'gemini')}
                      className={`px-2 py-2.5 rounded-lg text-[11px] font-sans font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 text-center ${
                        settings.voiceoverType === 'gemini'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/60 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Gemini AI স্টুডিও ভয়েস</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: Single Custom Full-Video Audio File */}
                {settings.voiceoverType === 'custom-full' && (
                  <div className="flex flex-col gap-3 mt-1 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-sans font-bold text-slate-100 flex items-center gap-1.5">
                        <FileAudio className="w-4 h-4 text-amber-500" />
                        সম্পূর্ণ ভিডিওর জন্য ১টি ভয়েস অডিও আপলোড করুন
                      </span>
                      <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                        আপনি নিজের রেকর্ড করা বা ডাউনলোড করা একটি সম্পূর্ণ অডিও ফাইল আপলোড করলে সব দৃশ্যের সাবটাইটেল এবং অটোহাইলাইট গ্লো ইফেক্ট অডিওটির সাথে নিখুঁতভাবে মিলে যাবে।
                      </p>
                    </div>

                    {settings.fullVoiceoverUrl ? (
                      <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-amber-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileAudio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs font-sans font-bold text-slate-200 truncate">
                                {settings.fullVoiceoverName || 'Master_Voice.mp3'}
                              </span>
                              <span className="text-[10px] font-mono text-amber-400 font-bold">
                                দৈর্ঘ্য: {settings.fullVoiceoverDuration || 0} সেকেন্ড
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={removeFullVoiceover}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="অডিও মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            settings.fullVoiceoverDuration &&
                            autoSyncSceneDurations(settings.fullVoiceoverDuration)
                          }
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer mt-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          সব দৃশ্যের সময়কাল অডিওর সাথে পুনরায় সিঙ্ক করুন
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="audio/*"
                          ref={fileInputRef}
                          onChange={handleFullVoiceUpload}
                          className="hidden"
                          id="full-voice-file-input"
                        />
                        <label
                          htmlFor="full-voice-file-input"
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-slate-950 font-sans font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          সম্পূর্ণ অডিও ফাইল সিলেক্ট করুন (MP3 / WAV)
                        </label>

                        {/* Or generate single full story Gemini TTS */}
                        <button
                          type="button"
                          onClick={handleGenerateFullGeminiAudio}
                          disabled={isGeneratingFullGemini}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-sans font-bold text-xs rounded-xl border border-slate-700/80 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          {isGeneratingFullGemini
                            ? 'সম্পূর্ণ গল্পের AI ভয়েস তৈরি হচ্ছে...'
                            : 'অথবা ১-ক্লিকে পুরো গল্পের Gemini AI অডিও বানান'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: Gemini AI Voiceover */}
                {settings.voiceoverType === 'gemini' && (
                  <div className="flex flex-col gap-2 mt-1">
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      💡 <strong className="text-amber-400">Gemini 2.5/3.1 TTS</strong> ইঞ্জিন দিয়ে দৃশ্যানুসারে উচ্চমানের ভয়েস প্লে করা হবে।
                    </p>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-400 font-sans font-semibold">গ্লোবাল ভয়েস চরিত্র (Gemini AI Voice):</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'Kore', name: 'Kore', gender: 'নারী', desc: 'সুন্দর ও স্পষ্ট' },
                          { id: 'Zephyr', name: 'Zephyr', gender: 'পুরুষ', desc: 'গম্ভীর ও চমৎকার' },
                          { id: 'Puck', name: 'Puck', gender: 'পুরুষ', desc: 'প্রাণবন্ত ও আকর্ষক' },
                          { id: 'Charon', name: 'Charon', gender: 'পুরুষ', desc: 'শান্ত ও ধীর' },
                          { id: 'Fenrir', name: 'Fenrir', gender: 'পুরুষ', desc: 'গভীর ও শক্তিশালী' },
                        ].map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => updateSetting('voiceoverVoice', v.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-sans border transition-all cursor-pointer ${
                              settings.voiceoverVoice === v.id
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Mic className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="font-bold">{v.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {v.gender} • {v.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
