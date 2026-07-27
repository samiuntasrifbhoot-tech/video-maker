/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  FileJson,
  Copy,
  Download,
  Upload,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Scene } from '../types';
import IslamicScriptLibraryModal from './IslamicScriptLibraryModal';
import { ISLAMIC_SCRIPT_LIBRARY } from '../data/islamicScripts';

interface PresetManagerProps {
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  setCurrentSceneIndex: (index: number) => void;
}

export default function PresetManager({
  scenes,
  setScenes,
  setCurrentSceneIndex,
}: PresetManagerProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleApplyPastedJson = () => {
    if (!pastedJson.trim()) {
      setPasteError('অনুগ্রহ করে বক্সে আপনার JSON কোড পেস্ট করুন!');
      return;
    }
    try {
      const imported: Scene[] = JSON.parse(pastedJson.trim());
      if (Array.isArray(imported) && imported.length > 0) {
        setScenes(imported);
        setCurrentSceneIndex(0);
        setPasteError(null);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 3500);
      } else {
        setPasteError('ভুল ফরম্যাট! অন্তত ১টি দৃশ্য বিশিষ্ট বৈধ JSON অ্যারেই পেস্ট করুন।');
      }
    } catch (err) {
      setPasteError('ভুল JSON সিনট্যাক্স! ব্র্যাকেট বা কমা সঠিক আছে কিনা পরীক্ষা করুন।');
    }
  };

  const copyConfigToClipboard = () => {
    const jsonString = JSON.stringify(scenes, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadConfigFile = () => {
    try {
      const jsonString = JSON.stringify(scenes, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `islamic-storyboard-${Date.now()}.json`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            const imported: Scene[] = JSON.parse(event.target.result as string);
            if (Array.isArray(imported) && imported.length > 0 && imported[0].subtitle) {
              setScenes(imported);
              setCurrentSceneIndex(0);
            } else {
              alert('ভুল ফাইল ফরম্যাট! দয়া করে সঠিক স্টোরিবোর্ড কনফিগ ফাইল আপলোড করুন।');
            }
          }
        } catch (err) {
          alert('ফাইলটি রিড করতে সমস্যা হয়েছে! সঠিক JSON ফাইল আপলোড করুন।');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col gap-5 bg-slate-950/40 border border-slate-900/60 backdrop-blur-xl p-5 rounded-2xl cinematic-card-glow">
      {/* Primary Islamic Script Library Option */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="font-sans font-bold text-slate-100 text-base">
              ইসলামিক স্ক্রিপ্ট লাইব্রেরি
            </h2>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
            {ISLAMIC_SCRIPT_LIBRARY.length} টি গল্প
          </span>
        </div>

        {/* Main Banner Button to open Islamic Script Library Modal */}
        <button
          onClick={() => setIsLibraryOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-950 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl transition-all duration-300 group cursor-pointer shadow-lg shadow-amber-500/5 hover:shadow-amber-500/15"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 rounded-xl shadow-md group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="font-sans font-extrabold text-white text-sm group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                ইসলামিক স্ক্রিপ্ট লাইব্রেরি ব্রাউজ করুন
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </span>
              <p className="font-sans text-xs text-slate-300 mt-0.5">
                সাহাবীদের জীবনী, নবী-রাসূলদের ঘটনা ও কুরআন হাদীসের ইতিহাসভিত্তিক রেডিমেড বাংলা স্ক্রিপ্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-slate-950 font-sans text-xs font-extrabold rounded-xl shrink-0 group-hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>স্ক্রিপ্ট দেখুন (+)</span>
          </div>
        </button>


      </div>

      {/* JSON Config Manager Section */}
      <div className="flex flex-col gap-3 border-t border-slate-800/60 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-sans text-slate-300 font-bold">
              JSON কোড পেস্ট / ব্যাকআপ ইম্পোর্ট:
            </span>
          </div>
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="text-[10px] text-amber-400 font-sans font-semibold hover:underline cursor-pointer"
          >
            লাইব্রেরিতে আরও দেখুন
          </button>
        </div>

        {/* Direct JSON Paste Textarea Section */}
        <div className="flex flex-col gap-2 bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-sans text-slate-300 font-semibold">
              📋 কাস্টম JSON পেস্ট (Ctrl+V) করুন:
            </label>
            {pasteSuccess && (
              <span className="text-[10px] text-green-400 font-sans font-bold animate-bounce flex items-center gap-1">
                <Check className="w-3 h-3 text-green-400" />
                সফলভাবে নতুন স্টোরিবোর্ড লোড হয়েছে!
              </span>
            )}
          </div>

          <textarea
            value={pastedJson}
            onChange={(e) => {
              setPastedJson(e.target.value);
              setPasteError(null);
            }}
            rows={3}
            placeholder={`এখানে আপনার JSON কোড সরাসরি পেস্ট করুন...
[
  {
    "id": "scene-1",
    "sceneNumber": 1,
    "title": "দৃশ্যের নাম",
    "subtitle": "বাংলা সাবটাইটেল...",
    "imageUrl": "https://...",
    "duration": 8
  }
]`}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20 leading-relaxed resize-y"
          />

          {pasteError && (
            <p className="text-[11px] font-sans text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded">
              ⚠️ {pasteError}
            </p>
          )}

          <button
            onClick={handleApplyPastedJson}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans text-xs font-bold rounded-lg transition-all duration-300 shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            JSON স্টোরিবোর্ড প্রয়োগ করুন
          </button>
        </div>

        {/* Copy / Download / File Upload helpers */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={copyConfigToClipboard}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-sans font-medium transition-all duration-300 active:scale-95 cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-amber-500" />
            )}
            {copied ? 'কপি হয়েছে' : 'কনফিগ কপি'}
          </button>

          <button
            onClick={downloadConfigFile}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-sans font-medium transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-500" />
            .JSON ফাইল ডাউনলোড
          </button>
        </div>

        {/* Import file upload button */}
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-sans font-medium transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            অথবা .JSON ফাইল আপলোড করুন
          </button>
        </div>
      </div>

      {/* Islamic Script Library Modal */}
      <IslamicScriptLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        scenes={scenes}
        setScenes={setScenes}
        setCurrentSceneIndex={setCurrentSceneIndex}
      />
    </div>
  );
}
