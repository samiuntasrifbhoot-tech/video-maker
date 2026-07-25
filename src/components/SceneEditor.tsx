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
  Video,
  Layers,
  Shuffle,
  Film,
  ArrowLeft,
  ArrowRight,
  SortAsc,
  ArrowUpDown,
  Mic,
} from 'lucide-react';
import { Scene, MotionPreset } from '../types';

interface SceneEditorProps {
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  currentSceneIndex: number;
  setCurrentSceneIndex: (index: number) => void;
}

const MOTION_PRESETS_LIST: MotionPreset[] = [
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'tilt-up',
  'tilt-down',
];

export default function SceneEditor({
  scenes,
  setScenes,
  currentSceneIndex,
  setCurrentSceneIndex,
}: SceneEditorProps) {
  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null);
  const singleFileInputRef = useRef<HTMLInputElement | null>(null);
  const sceneAudioInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState<number>(3.5);

  // Update current scene fields
  const updateCurrentScene = (updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((scene, idx) => (idx === currentSceneIndex ? { ...scene, ...updates } : scene))
    );
  };

  // Shift scene position in list
  const moveScene = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= scenes.length) return;
    const newScenes = [...scenes];
    const [moved] = newScenes.splice(fromIdx, 1);
    newScenes.splice(toIdx, 0, moved);
    const renumbered = newScenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setScenes(renumbered);
    if (currentSceneIndex === fromIdx) {
      setCurrentSceneIndex(toIdx);
    }
  };

  // Sort scenes alphabetically by title/filename
  const sortScenesByName = () => {
    const sorted = [...scenes].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
    );
    const renumbered = sorted.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setScenes(renumbered);
    setCurrentSceneIndex(0);
  };

  // Reverse scene order
  const reverseScenes = () => {
    const reversed = [...scenes].reverse();
    const renumbered = reversed.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setScenes(renumbered);
    setCurrentSceneIndex(0);
  };

  // Process multiple images at once to generate ordered scenes
  const processBulkImages = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    // Use file picker sequence as selected by user
    const newScenes: Scene[] = imageFiles.map((file, idx) => {
      const localUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const motion = MOTION_PRESETS_LIST[idx % MOTION_PRESETS_LIST.length];

      return {
        id: `bulk-scene-${Date.now()}-${idx}`,
        sceneNumber: idx + 1,
        title: `দৃশ্য ${idx + 1}: ${cleanName}`,
        subtitle: `দৃশ্য ${idx + 1} - ক্যাপশন বা বিস্তারিত বিবরণ এখানে লিখুন`,
        imageUrl: localUrl,
        isCustomImage: true,
        motionPreset: motion,
        duration: defaultDuration,
      };
    });

    setScenes(newScenes);
    setCurrentSceneIndex(0);
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processBulkImages(e.target.files);
    }
  };

  // Drag and drop for bulk upload
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processBulkImages(e.dataTransfer.files);
    }
  };

  // Single scene image change
  const handleSingleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const localUrl = URL.createObjectURL(file);
        updateCurrentScene({
          imageUrl: localUrl,
          isCustomImage: true,
        });
      }
    }
  };

  // Add new scene
  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      sceneNumber: nextNum,
      title: `দৃশ্য ${nextNum}`,
      subtitle: `দৃশ্য ${nextNum} এর বিবরণ`,
      imageUrl:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: MOTION_PRESETS_LIST[(nextNum - 1) % MOTION_PRESETS_LIST.length],
      duration: defaultDuration,
    };
    setScenes((prev) => [...prev, newScene]);
    setCurrentSceneIndex(scenes.length);
  };

  // Delete scene
  const handleDeleteScene = (indexToDelete: number) => {
    if (scenes.length <= 1) {
      alert('ভিডিওতে অন্তত একটি দৃশ্য থাকা আবশ্যক!');
      return;
    }
    const filtered = scenes.filter((_, idx) => idx !== indexToDelete);
    const renumbered = filtered.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setScenes(renumbered);
    if (currentSceneIndex >= renumbered.length) {
      setCurrentSceneIndex(renumbered.length - 1);
    }
  };

  // Apply same duration to all scenes
  const applyDurationToAll = (sec: number) => {
    setDefaultDuration(sec);
    setScenes((prev) => prev.map((s) => ({ ...s, duration: sec })));
  };

  // Randomize all camera animations
  const randomizeAllMotions = () => {
    setScenes((prev) =>
      prev.map((s, idx) => ({
        ...s,
        motionPreset:
          MOTION_PRESETS_LIST[Math.floor(Math.random() * MOTION_PRESETS_LIST.length)],
      }))
    );
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
    <div className="flex flex-col gap-5 bg-slate-950/40 border border-slate-900/60 backdrop-blur-xl p-5 rounded-2xl cinematic-card-glow">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-3">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-amber-500" />
          <h2 className="font-sans font-bold text-slate-100 text-base">
            ফেসবুক রিলস বাল্ক ফটো ও অটো এডিটর
          </h2>
        </div>
        <span className="bg-slate-900 text-amber-400 border border-amber-500/10 font-mono text-xs px-2.5 py-0.5 rounded-md font-bold">
          মোট দৃশ্য: {scenes.length}
        </span>
      </div>

      {/* BULK IMAGE UPLOAD BOX (High Priority Feature requested by user) */}
      <div className="flex flex-col gap-2 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-sans font-extrabold text-amber-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-500" />
            একসাথে সব ছবি দিয়ে রিলস বানান (Batch Upload):
          </label>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded font-bold">
            সিরিয়াল মেইনটেইন
          </span>
        </div>

        <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
          আপনার ভিডিওর ছবিগুলো একবারে সিলেক্ট করুন (যেমন: ১, ২, ৩...)। সবগুলো ছবি সিরিয়াল অনুযায়ী একের পর এক সাজিয়ে অটোমেটিক রিলস ভিডিও তৈরি হয়ে যাবে।
        </p>

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => bulkFileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? 'border-amber-400 bg-amber-500/15'
              : 'border-amber-500/30 hover:border-amber-400 bg-slate-950/60 hover:bg-slate-950/90'
          }`}
        >
          <input
            type="file"
            ref={bulkFileInputRef}
            onChange={handleBulkFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Upload className="w-7 h-7 text-amber-400 mx-auto mb-1.5 animate-bounce" />
          <p className="font-sans text-xs text-white font-bold">
            📂 একসাথে সব ছবি সিলেক্ট করতে এখানে ক্লিক করুন (বা ড্র্যাগ করুন)
          </p>
          <p className="font-sans text-[10px] text-slate-400 mt-1">
            (একাধিক ছবি একবারে বেছে নিলে সিরিয়াল অনুযায়ী রিলস দৃশ্য তৈরি হবে)
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>প্রতি ছবির সময়:</span>
            <div className="flex gap-1">
              {[3, 3.5, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => applyDurationToAll(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                    defaultDuration === s
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={randomizeAllMotions}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-sans font-bold rounded cursor-pointer transition-colors border border-amber-500/20"
            title="সব ছবির জুম ও প্যান অ্যানিমেশন এলোমেলো করুন"
          >
            <Shuffle className="w-3 h-3" />
            অ্যানিমেশন ভ্যারিয়েশন
          </button>
        </div>
      </div>

      {/* Grid selector of scenes */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-sans text-slate-300 font-bold flex items-center gap-1.5">
            দৃশ্যসমূহ (অর্ডার পরিবর্তন করতে ◀/▶ চাপুন):
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={sortScenesByName}
              className="flex items-center gap-1 text-[10px] font-sans font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-800 cursor-pointer"
              title="ফাইলের নাম বা টাইটেল অনুযায়ী ক্রমানুসারে সাজান"
            >
              <SortAsc className="w-3 h-3 text-amber-500" />
              নাম অনুযায়ী
            </button>
            <button
              type="button"
              onClick={reverseScenes}
              className="flex items-center gap-1 text-[10px] font-sans font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-800 cursor-pointer"
              title="দৃশ্যগুলোর ক্রমানুসার উল্টে দিন"
            >
              <ArrowUpDown className="w-3 h-3 text-amber-500" />
              রিভার্স
            </button>
            <button
              type="button"
              onClick={handleAddScene}
              className="flex items-center gap-1 text-[11px] font-sans font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন দৃশ্য যোগ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 custom-scrollbar">
          {scenes.map((scene, idx) => (
            <div
              key={scene.id}
              className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all duration-350 shadow-md ${
                idx === currentSceneIndex
                  ? 'border-amber-500 ring-2 ring-amber-500/20 scale-105 shadow-amber-500/10 z-10'
                  : 'border-slate-800/80 hover:border-slate-700 bg-slate-950 opacity-75 hover:opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={() => setCurrentSceneIndex(idx)}
                className="w-full h-full text-left cursor-pointer"
              >
                <img
                  src={scene.imageUrl || null}
                  alt={scene.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity hover:bg-black/20">
                  <span className="text-xs font-mono font-extrabold text-white text-shadow-custom">
                    #{scene.sceneNumber}
                  </span>
                </div>
              </button>

              {/* Order Move & Delete Overlay Buttons */}
              <div className="absolute top-1 inset-x-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveScene(idx, idx - 1);
                    }}
                    className="p-1 bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white rounded-full transition-colors cursor-pointer shadow"
                    title="বামে সরান"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                )}
                {idx < scenes.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveScene(idx, idx + 1);
                    }}
                    className="p-1 bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white rounded-full transition-colors cursor-pointer shadow ml-auto"
                    title="ডানে সরান"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScene(idx);
                    }}
                    className="p-1 bg-red-600/90 hover:bg-red-500 text-white rounded-full transition-opacity cursor-pointer shadow ml-1"
                    title="দৃশ্য ডিলিট করুন"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editing options for currently selected scene */}
      <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans font-bold text-amber-400">
            দৃশ্য #{currentScene.sceneNumber} এর বিবরণ ও সেটিংস:
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {currentScene.duration} সেকেন্ড • {currentScene.motionPreset}
          </span>
        </div>

        {/* Title input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-sans text-slate-400 font-semibold">
            দৃশ্যের শিরোনাম (Title):
          </label>
          <input
            type="text"
            value={currentScene.title}
            onChange={(e) => updateCurrentScene({ title: e.target.value })}
            className="bg-slate-950/85 border border-slate-800 text-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 font-sans transition-all duration-300"
          />
        </div>

        {/* Subtitle / Script input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-sans text-slate-400 font-semibold">
            ক্যাপশন বা বাংলা সাবটাইটেল (Reel Subtitle):
          </label>
          <textarea
            value={currentScene.subtitle}
            onChange={(e) => updateCurrentScene({ subtitle: e.target.value })}
            rows={3}
            className="bg-slate-950/85 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 font-sans resize-none leading-relaxed transition-all duration-300"
            placeholder="রিলসে দেখানোর জন্য বার্তা বা বাংলা সাবটাইটেল লিখুন..."
          />
        </div>

        {/* Single Image Replace & Duration Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Change Single Image */}
          <div className="flex flex-col gap-1.5 justify-between bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
            <label className="text-xs font-sans text-slate-300 font-bold">
              শুধু এই দৃশ্যের ছবি পরিবর্তন:
            </label>
            <input
              type="file"
              ref={singleFileInputRef}
              onChange={handleSingleImageChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => singleFileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-sans font-bold rounded-xl border border-slate-700 cursor-pointer transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              নতুন ছবি সিলেক্ট করুন
            </button>
          </div>

          {/* RESTORED: Single Scene Duration Option right next to Select Image */}
          <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans text-slate-300 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                ছবির সময়কাল (Duration):
              </label>
              <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-amber-500/20">
                {currentScene.duration}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={currentScene.duration}
              onChange={(e) => updateCurrentScene({ duration: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer my-1"
            />
            <div className="flex gap-1 justify-between">
              {[2, 3.5, 5, 8, 10].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateCurrentScene({ duration: sec })}
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-colors ${
                    currentScene.duration === sec
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Per-Scene Custom Voiceover Audio */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans text-slate-300 font-bold flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-500" />
                এই নির্দিষ্ট দৃশ্যের কাস্টম ভয়েস রেকর্ড/অডিও:
              </label>
              {currentScene.voiceoverAudioName && (
                <span className="text-amber-400 text-[11px] font-mono font-bold truncate max-w-[200px]">
                  ✓ {currentScene.voiceoverAudioName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={sceneAudioInputRef}
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const audioUrl = URL.createObjectURL(file);
                    const tempAudio = new Audio(audioUrl);
                    tempAudio.onloadedmetadata = () => {
                      const autoDur = Math.max(currentScene.duration, Math.ceil(tempAudio.duration));
                      updateCurrentScene({
                        voiceoverAudioUrl: audioUrl,
                        voiceoverAudioName: file.name,
                        duration: autoDur,
                      });
                    };
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => sceneAudioInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-sans font-semibold rounded-xl border border-slate-700 cursor-pointer transition-colors"
              >
                <Mic className="w-3.5 h-3.5 text-amber-500" />
                {currentScene.voiceoverAudioName ? 'ভয়েস ফাইল পরিবর্তন করুন' : 'এই দৃশ্যের নিজস্ব ভয়েস ফাইল আপলোড করুন'}
              </button>
              {currentScene.voiceoverAudioUrl && (
                <button
                  type="button"
                  onClick={() =>
                    updateCurrentScene({
                      voiceoverAudioUrl: undefined,
                      voiceoverAudioName: undefined,
                    })
                  }
                  className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 text-xs rounded-xl border border-red-800/80 cursor-pointer font-bold"
                  title="অডিও মুছে ফেলুন"
                >
                  রিমুভ
                </button>
              )}
            </div>
          </div>

          {/* Camera Animation preset */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-sans text-slate-400 font-semibold flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-amber-500" />
              ক্যামেরা জুম/প্যান অ্যানিমেশন ইফেক্ট (Camera Motion Effect):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { value: 'zoom-in', label: 'জুম ইন (Zoom In)' },
                { value: 'zoom-out', label: 'জুম আউট (Zoom Out)' },
                { value: 'pan-left', label: 'বামে প্যান (Pan Left)' },
                { value: 'pan-right', label: 'ডানে প্যান (Pan Right)' },
                { value: 'tilt-up', label: 'উপরে টিল্ট (Tilt Up)' },
                { value: 'tilt-down', label: 'নিচে টিল্ট (Tilt Down)' },
                { value: 'static', label: 'স্থির (Static)' },
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => updateCurrentScene({ motionPreset: m.value as MotionPreset })}
                  className={`px-2 py-2 rounded-xl text-[11px] font-sans border text-center transition-all cursor-pointer ${
                    currentScene.motionPreset === m.value
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
