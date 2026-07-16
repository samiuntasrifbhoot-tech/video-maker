/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Upload,
  Clock,
  Settings,
  Sparkles,
  Trash2,
  RefreshCw,
  Plus,
  HelpCircle,
  Video,
} from 'lucide-react';
import { Scene, MotionPreset } from '../types';

interface SceneEditorProps {
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  currentSceneIndex: number;
  setCurrentSceneIndex: (index: number) => void;
}

export default function SceneEditor({
  scenes,
  setScenes,
  currentSceneIndex,
  setCurrentSceneIndex,
}: SceneEditorProps) {
  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Generate realistic Gemini TTS voice
  const handleGenerateGeminiVoice = async () => {
    if (!currentScene.subtitle) {
      setVoiceError("ভয়েস তৈরি করার জন্য কোনো টেক্সট বা সাবটাইটেল নেই!");
      return;
    }
    
    setIsGeneratingVoice(true);
    setVoiceError(null);
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentScene.subtitle, voice: selectedVoice }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "ভয়েস ওভার জেনারেট করতে সমস্যা হয়েছে।");
      }
      
      // Decode base64 to binary
      const binary = atob(data.base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Create a Blob and Object URL
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const localUrl = URL.createObjectURL(blob);
      
      updateCurrentScene({
        voiceoverAudioUrl: localUrl,
        voiceoverAudioName: `Gemini-${selectedVoice}.wav`,
      });
    } catch (err: any) {
      console.error(err);
      setVoiceError(err.message || "ভয়েস জেনারেট করতে ব্যর্থ হয়েছে।");
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Update a field in the current active scene
  const updateCurrentScene = (updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((scene, idx) => (idx === currentSceneIndex ? { ...scene, ...updates } : scene))
    );
  };

  // Handle image upload and generate a local URL
  const handleImageFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      updateCurrentScene({
        imageUrl: localUrl,
        isCustomImage: true,
      });
    }
  };

  const handleAudioFile = (file: File) => {
    if (file && file.type.startsWith('audio/')) {
      const localUrl = URL.createObjectURL(file);
      updateCurrentScene({
        voiceoverAudioUrl: localUrl,
        voiceoverAudioName: file.name,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAudioFile(e.target.files[0]);
    }
  };

  const removeAudioFile = () => {
    updateCurrentScene({
      voiceoverAudioUrl: undefined,
      voiceoverAudioName: undefined,
    });
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  // Reset image to original Unsplash default
  const resetImageToDefault = () => {
    // Original unsplash links matching scene index
    const originalUrls = [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582281227297-f01cf4e39436?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
    ];
    
    // Check if within bounds of initial presets
    if (currentSceneIndex < originalUrls.length) {
      updateCurrentScene({
        imageUrl: originalUrls[currentSceneIndex],
        isCustomImage: false,
      });
    }
  };

  const motionPresets: { value: MotionPreset; label: string }[] = [
    { value: 'zoom-in', label: 'ধীরে ধীরে জুম ইন (Zoom In)' },
    { value: 'zoom-out', label: 'ধীরে ধীরে জুম আউট (Zoom Out)' },
    { value: 'pan-left', label: 'বামে প্যানিং (Pan Left)' },
    { value: 'pan-right', label: 'ডানে প্যানিং (Pan Right)' },
    { value: 'tilt-up', label: 'উপরে টিল্ট (Tilt Up)' },
    { value: 'tilt-down', label: 'নিচে টিল্ট (Tilt Down)' },
    { value: 'static', label: 'স্থির চিত্র (Static)' },
  ];

  return (
    <div className="flex flex-col gap-5 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl cinematic-glow">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" />
          <h2 className="font-sans font-bold text-slate-100 text-base">সিনেম্যাটিক দৃশ্য এডিটর</h2>
        </div>
        <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2 py-0.5 rounded-md">
          দৃশ্য: {currentScene.sceneNumber} / {scenes.length}
        </span>
      </div>

      {/* Grid selector of scenes */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-sans text-slate-400 font-semibold">দৃশ্য নির্বাচন করুন:</span>
        <div className="grid grid-cols-6 gap-2">
          {scenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => setCurrentSceneIndex(idx)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                idx === currentSceneIndex
                  ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105'
                  : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={scene.imageUrl}
                alt={scene.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-sm font-mono font-bold text-white text-shadow-custom">
                  {scene.sceneNumber}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editing options for selected scene */}
      <div className="flex flex-col gap-4">
        {/* Title input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-sans text-slate-400 font-semibold">দৃশ্যের শিরোনাম:</label>
          <input
            type="text"
            value={currentScene.title}
            onChange={(e) => updateCurrentScene({ title: e.target.value })}
            className="bg-slate-950/80 border border-slate-800 text-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500/70 font-sans"
          />
        </div>

        {/* Subtitle / Narrative voice script */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-sans text-slate-400 font-semibold">
            স্ক্রিপ্ট ও সাবটাইটেল (বাংলা):
          </label>
          <textarea
            value={currentScene.subtitle}
            onChange={(e) => updateCurrentScene({ subtitle: e.target.value })}
            rows={4}
            className="bg-slate-950/80 border border-slate-800 text-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500/70 font-sans resize-none leading-relaxed"
            placeholder="স্ক্রিপ্ট লিখুন যা স্ক্রিনে প্রদর্শিত হবে..."
          />
        </div>

        {/* Upload Image Section */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-sans text-slate-400 font-semibold">দৃশ্যের চিত্র পরিবর্তন করুন:</label>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-amber-500 bg-amber-500/5'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="font-sans text-xs text-slate-300 font-medium">
              আপনার ইমেজ ফাইলটি এখানে ড্র্যাগ করে ছাড়ুন অথবা ক্লিক করে সিলেক্ট করুন
            </p>
            <p className="font-sans text-[10px] text-slate-500 mt-1">
              (PNG, JPG বা WebP ফরম্যাট)
            </p>
          </div>

          {currentScene.isCustomImage && (
            <button
              onClick={resetImageToDefault}
              className="flex items-center gap-1.5 self-start text-[11px] font-sans text-amber-500 hover:text-amber-400 font-semibold mt-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              ডিফল্ট ছবিতে ফিরে যান
            </button>
          )}
        </div>

        {/* Voiceover Upload Section */}
        <div className="flex flex-col gap-2.5 border-t border-slate-800/80 pt-4 mt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-sans text-slate-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              দৃশ্যের ভয়েস ওভার (Voiceover):
            </label>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 font-sans px-2 py-0.5 rounded-full font-medium">
              গুগল এআই স্টুডিও ২.৫ প্রো টিটিএস
            </span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3">
            {/* Gemini TTS generator section */}
            <div className="flex flex-col gap-2 bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  এআই ভয়েস জেনারেটর (Gemini TTS)
                </span>
                <span className="text-[9px] text-slate-400 font-sans">উচ্চমানের রিয়েলিস্টিক ভয়েস</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-sans text-slate-400">ভয়েস চরিত্র:</span>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs font-sans focus:outline-none focus:border-amber-500"
                  >
                    <option value="Kore">Kore (নারী - সুন্দর ও স্পষ্ট)</option>
                    <option value="Zephyr">Zephyr (পুরুষ - গম্ভীর ও চমৎকার)</option>
                    <option value="Puck">Puck (পুরুষ - প্রাণবন্ত ও আকর্ষক)</option>
                    <option value="Charon">Charon (পুরুষ - শান্ত ও ধীর)</option>
                    <option value="Fenrir">Fenrir (পুরুষ - গভীর ও শক্তিশালী)</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={isGeneratingVoice}
                    onClick={handleGenerateGeminiVoice}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-xs font-sans font-bold rounded cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isGeneratingVoice ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        জেনারেট হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        ভয়েস জেনারেট করুন
                      </>
                    )}
                  </button>
                </div>
              </div>

              {voiceError && (
                <p className="text-[10px] text-red-400 font-sans mt-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                  ⚠️ {voiceError}
                </p>
              )}
            </div>

            <div className="border-t border-slate-850 my-1" />

            {/* Manual file upload section */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-sans font-bold text-slate-400">ম্যানুয়াল ভয়েস ফাইল আপলোড:</span>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioChange}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold rounded transition-colors border border-slate-700 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  {currentScene.voiceoverAudioName ? 'ভয়েস পরিবর্তন করুন' : 'ভয়েস ফাইল আপলোড করুন'}
                </button>

                {currentScene.voiceoverAudioName && (
                  <button
                    type="button"
                    onClick={removeAudioFile}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-sans font-semibold cursor-pointer"
                    title="ভয়েস ডিলিট করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    মুছে ফেলুন
                  </button>
                )}
              </div>
            </div>

            {currentScene.voiceoverAudioName && (
              <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-lg font-sans mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate max-w-[200px] font-mono font-medium">{currentScene.voiceoverAudioName}</span>
                <span className="text-[10px] text-emerald-500 shrink-0 font-bold">(সক্রিয়)</span>
              </div>
            )}
          </div>
        </div>

        {/* Layout Row: Timing & Ken Burns Presets */}
        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans text-slate-400 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              দৃশ্যের সময়সীমা:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="3"
                max="30"
                value={currentScene.duration}
                onChange={(e) =>
                  updateCurrentScene({ duration: Math.max(3, parseInt(e.target.value) || 3) })
                }
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono text-center focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs font-sans text-slate-400 font-semibold">সেকেন্ড</span>
            </div>
          </div>

          {/* Ken Burns Motion Preset */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-sans text-slate-400 font-semibold flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-slate-500" />
              ক্যামেরা অ্যানিমেশন (Ken Burns):
            </label>
            <select
              value={currentScene.motionPreset}
              onChange={(e) => updateCurrentScene({ motionPreset: e.target.value as MotionPreset })}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-sans focus:outline-none focus:border-amber-500"
            >
              {motionPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
