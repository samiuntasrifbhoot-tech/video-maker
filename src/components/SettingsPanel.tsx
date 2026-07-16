/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Type,
  Maximize2,
  Sparkles,
  Volume2,
  Mic,
  Palette,
  Layout,
  AlignLeft,
} from 'lucide-react';
import { VideoSettings } from '../types';

interface SettingsPanelProps {
  settings: VideoSettings;
  setSettings: React.Dispatch<React.SetStateAction<VideoSettings>>;
}

export default function SettingsPanel({ settings, setSettings }: SettingsPanelProps) {
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

  return (
    <div className="flex flex-col gap-5 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl cinematic-glow">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Palette className="w-5 h-5 text-amber-500" />
        <h2 className="font-sans font-bold text-slate-100 text-base">ভিডিও ও সাবটাইটেল সেটিংস</h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* Subtitle Style Header */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-sans text-slate-400 font-semibold flex items-center gap-1">
            <Type className="w-4 h-4 text-slate-500" />
            সাবটাইটেল স্টাইল এডিটর:
          </span>

          {/* Subtitle Color Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-sans">সাবটাইটেল কালার:</label>
            <div className="flex flex-wrap gap-2">
              {subtitleColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateSetting('subtitleColor', color.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans border transition-all duration-300 ${
                    settings.subtitleColor === color.value
                      ? 'bg-slate-800 text-slate-100 border-amber-500'
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
          <div className="grid grid-cols-2 gap-4 mt-1">
            {/* Font Family */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-sans">ফন্ট ধরণ:</label>
              <select
                value={settings.subtitleFontFamily}
                onChange={(e) => updateSetting('subtitleFontFamily', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-sans focus:outline-none focus:border-amber-500"
              >
                <option value="sans">Hind Siliguri (Sans-Serif)</option>
                <option value="serif">Noto Serif Bengali (Serif)</option>
              </select>
            </div>

            {/* Subtitle Position */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-sans">স্ক্রিন অবস্থান:</label>
              <select
                value={settings.subtitlePosition}
                onChange={(e) =>
                  updateSetting('subtitlePosition', e.target.value as VideoSettings['subtitlePosition'])
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-sans focus:outline-none focus:border-amber-500"
              >
                <option value="bottom">নিচে (Bottom)</option>
                <option value="middle">মাঝখানে (Middle)</option>
                <option value="top">উপরে (Top)</option>
              </select>
            </div>
          </div>

          {/* Subtitle Animation */}
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-xs text-slate-400 font-sans">সাবটাইটেল মোড / অ্যানিমেশন:</label>
            <select
              value={settings.subtitleAnimation}
              onChange={(e) =>
                updateSetting(
                  'subtitleAnimation',
                  e.target.value as VideoSettings['subtitleAnimation']
                )
              }
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:border-amber-500"
            >
              <option value="word-by-word">অটো হাইলাইট - TikTok/Reels স্টাইল (Word Highlighter)</option>
              <option value="fade-in">ধীরে প্রকাশ - Cinematic Fade-In</option>
              <option value="none">সাধারণ প্রদর্শন - Static Subtitles</option>
            </select>
          </div>

          {/* Sliders row */}
          <div className="grid grid-cols-2 gap-4 mt-2">
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

        {/* Transition Style selector */}
        <div className="flex flex-col gap-1.5 border-t border-slate-800/60 pt-4">
          <label className="text-xs font-sans text-slate-400 font-semibold flex items-center gap-1">
            <Layout className="w-4 h-4 text-slate-500" />
            দৃশ্যের ট্রানজিশন ইফেক্ট (Transitions):
          </label>
          <select
            value={settings.transitionStyle}
            onChange={(e) =>
              updateSetting('transitionStyle', e.target.value as VideoSettings['transitionStyle'])
            }
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:border-amber-500"
          >
            <option value="crossfade">ক্রসফেড (Crossfade)</option>
            <option value="slide-left">বামে স্লাইড (Slide Left)</option>
            <option value="dip-to-black">ডিপ টু ব্ল্যাক (Dip to Black)</option>
            <option value="zoom-fade">জুম ও ফেড (Zoom & Fade)</option>
          </select>
        </div>

        {/* AI Voiceover Section */}
        <div className="flex flex-col gap-3 border-t border-slate-800/60 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-slate-400 font-semibold flex items-center gap-1">
              <Mic className="w-4 h-4 text-slate-500" />
              অটো ভয়েসওভার (AI Narration):
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
            <div className="flex flex-col gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {/* Voiceover Engine Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-sans">ভয়েস ইঞ্জিন ধরণ:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSetting('voiceoverType', 'gemini')}
                    className={`px-2.5 py-1.5 rounded text-xs font-sans font-semibold border transition-all ${
                      settings.voiceoverType === 'gemini'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    Gemini AI ভয়েস (Ultra)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSetting('voiceoverType', 'browser')}
                    className={`px-2.5 py-1.5 rounded text-xs font-sans font-semibold border transition-all ${
                      settings.voiceoverType === 'browser'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    ব্রাউজার ভয়েস (ফ্রি)
                  </button>
                </div>
              </div>

              {settings.voiceoverType === 'gemini' ? (
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    💡 <strong className="text-amber-400">Gemini 3.1 TTS</strong> ইঞ্জিন দিয়ে রিয়েল-টাইমে প্রতিটি দৃশ্যের জন্য চমৎকার ভয়েস জেনারেট করা হবে।
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-sans">গ্লোবাল ভয়েস চরিত্র:</label>
                    <select
                      value={settings.voiceoverVoice}
                      onChange={(e) => updateSetting('voiceoverVoice', e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1.5 text-xs font-sans focus:outline-none focus:border-amber-500"
                    >
                      <option value="Kore">Kore (নারী - সুন্দর ও স্পষ্ট)</option>
                      <option value="Zephyr">Zephyr (পুরুষ - গম্ভীর ও চমৎকার)</option>
                      <option value="Puck">Puck (পুরুষ - প্রাণবন্ত ও আকর্ষক)</option>
                      <option value="Charon">Charon (পুরুষ - শান্ত ও ধীর)</option>
                      <option value="Fenrir">Fenrir (পুরুষ - গভীর ও শক্তিশালী)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    ভয়েসওভারটি ব্রাউজারের <strong className="text-amber-400">SpeechSynthesis</strong> ব্যবহার করে পাঠ করবে।
                  </p>

                  {/* Speech parameters */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Speech rate */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400 font-sans flex justify-between">
                        <span>পাঠের গতি:</span>
                        <span className="font-mono text-[10px] text-amber-500 font-bold">
                          {settings.voiceoverRate}x
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0.6"
                        max="1.6"
                        step="0.1"
                        value={settings.voiceoverRate}
                        onChange={(e) => updateSetting('voiceoverRate', parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Speech pitch */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400 font-sans flex justify-between">
                        <span>কণ্ঠস্বর (Pitch):</span>
                        <span className="font-mono text-[10px] text-amber-500 font-bold">
                          {settings.voiceoverPitch}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0.6"
                        max="1.4"
                        step="0.1"
                        value={settings.voiceoverPitch}
                        onChange={(e) => updateSetting('voiceoverPitch', parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
