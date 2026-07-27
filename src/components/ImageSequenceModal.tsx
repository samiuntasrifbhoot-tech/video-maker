/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  X,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  SortAsc,
  Shuffle,
  Trash2,
  Film,
  Sparkles,
} from 'lucide-react';
import { Scene } from '../types';

interface TempImageItem {
  id: string;
  file?: File;
  name: string;
  previewUrl: string;
}

interface ImageSequenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Mode 1: Reorder raw uploaded files before scene creation
  rawFiles?: File[];
  onConfirmRawSequence?: (orderedFiles: File[]) => void;
  // Mode 2: Reorder existing scenes in project
  existingScenes?: Scene[];
  onConfirmSceneSequence?: (orderedScenes: Scene[]) => void;
}

export default function ImageSequenceModal({
  isOpen,
  onClose,
  rawFiles,
  onConfirmRawSequence,
  existingScenes,
  onConfirmSceneSequence,
}: ImageSequenceModalProps) {
  const [items, setItems] = useState<TempImageItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (rawFiles && rawFiles.length > 0) {
      const formatted = rawFiles.map((file, idx) => ({
        id: `raw-${idx}-${file.name}`,
        file,
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        previewUrl: URL.createObjectURL(file),
      }));
      setItems(formatted);
    } else if (existingScenes && existingScenes.length > 0) {
      const formatted = existingScenes.map((sc, idx) => ({
        id: sc.id || `sc-${idx}`,
        name: sc.title || `দৃশ্য ${idx + 1}`,
        previewUrl: sc.imageUrl,
      }));
      setItems(formatted);
    }
  }, [isOpen, rawFiles, existingScenes]);

  if (!isOpen) return null;

  // Move item up/down
  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setItems(updated);
  };

  // Swap position directly with position dropdown
  const changePosition = (fromIdx: number, targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= items.length || fromIdx === targetIdx) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setItems(updated);
  };

  // Reverse sequence
  const reverseSequence = () => {
    setItems([...items].reverse());
  };

  // Sort by filename / title
  const sortByName = () => {
    const sorted = [...items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    setItems(sorted);
  };

  // Delete item from sequence
  const removeItem = (indexToRemove: number) => {
    if (items.length <= 1) {
      alert('কমপক্ষে ১টি ছবি থাকা আবশ্যক!');
      return;
    }
    setItems(items.filter((_, idx) => idx !== indexToRemove));
  };

  // Save changes
  const handleSave = () => {
    if (rawFiles && onConfirmRawSequence) {
      const finalFiles = items.map((it) => it.file!).filter(Boolean);
      onConfirmRawSequence(finalFiles);
    } else if (existingScenes && onConfirmSceneSequence) {
      // Map original scene objects according to new items array order
      const newScenesList: Scene[] = items.map((it, newIdx) => {
        const foundOriginal = existingScenes.find((s) => s.id === it.id);
        if (foundOriginal) {
          return {
            ...foundOriginal,
            sceneNumber: newIdx + 1,
          };
        }
        return existingScenes[newIdx];
      });
      onConfirmSceneSequence(newScenesList);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col cinematic-card-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-sans font-bold text-slate-100 flex items-center gap-2">
                ছবি ও দৃশ্যের ক্রম সাজান (Image Sequence Rearranger)
                <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  {items.length} টি ছবি
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                ছবির নতুন ক্রম তৈরি করতে তীর চিহ্ন দিয়ে উপরে/নিচে সরান বা পজিশন নম্বর নির্বাচন করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tools */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={sortByName}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-bold rounded-lg border border-slate-700 cursor-pointer"
            >
              <SortAsc className="w-3.5 h-3.5 text-amber-500" />
              <span>ফাইলের নাম অনুযায়ী (১, ২, ৩...)</span>
            </button>

            <button
              onClick={reverseSequence}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-bold rounded-lg border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>ক্রম উল্টে দিন (Reverse)</span>
            </button>
          </div>

          <span className="text-[11px] text-amber-400 font-sans">
            💡 টিপস: আপনি সরাসরি পজিশন নম্বর বদলে ছবি যেকোনো জায়গায় বসাতে পারেন
          </span>
        </div>

        {/* Images List */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2.5 custom-scrollbar">
          {items.map((item, idx) => (
            <div
              key={item.id + idx}
              className="flex items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all duration-200"
            >
              {/* Left thumbnail & title */}
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="w-7 h-7 flex items-center justify-center bg-amber-500 text-slate-950 font-mono font-extrabold text-xs rounded-lg shrink-0">
                  #{idx + 1}
                </span>

                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-lg border border-slate-800 shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-sans font-bold text-slate-200 truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    বর্তমান অবস্থান: {idx + 1} অফ {items.length}
                  </span>
                </div>
              </div>

              {/* Right Order Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Position Select */}
                <select
                  value={idx}
                  onChange={(e) => changePosition(idx, parseInt(e.target.value, 10))}
                  className="bg-slate-900 border border-slate-800 text-amber-400 font-mono text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {items.map((_, pIdx) => (
                    <option key={pIdx} value={pIdx}>
                      অবস্থান #{pIdx + 1} এ পাঠাও
                    </option>
                  ))}
                </select>

                {/* Up/Down buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="উপরে সরান"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => moveItem(idx, idx + 1)}
                    disabled={idx === items.length - 1}
                    className="p-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="নিচে সরান"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeItem(idx)}
                  className="p-1.5 bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
                  title="ছবি বাদ দিন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans font-bold rounded-xl cursor-pointer"
          >
            বাতিল করুন
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-xs font-sans font-extrabold rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
          >
            <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>এই ক্রমানুসারে রিলস দৃশ্য তৈরি করুন ✓</span>
          </button>
        </div>
      </div>
    </div>
  );
}
