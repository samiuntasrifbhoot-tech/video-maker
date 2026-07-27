/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  Sparkles,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  FileJson,
  Copy,
  Download,
  Upload,
  Clock,
  Film,
  Layers,
} from 'lucide-react';
import { Scene } from '../types';
import { ISLAMIC_SCRIPT_LIBRARY, ScriptItem } from '../data/islamicScripts';

interface IslamicScriptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  setCurrentSceneIndex: (index: number) => void;
}

export default function IslamicScriptLibraryModal({
  isOpen,
  onClose,
  scenes,
  setScenes,
  setCurrentSceneIndex,
}: IslamicScriptLibraryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('সকল স্ক্রিপ্ট');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedScriptId, setExpandedScriptId] = useState<string | null>(null);
  const [loadedSuccessId, setLoadedSuccessId] = useState<string | null>(null);

  // Tab state for Library vs JSON Config Manager
  const [activeTab, setActiveTab] = useState<'library' | 'config'>('library');

  // Config tab states
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const categories = [
    'সকল স্ক্রিপ্ট',
    'সাহাবীদের জীবনী',
    'নবী-রাসূলদের ঘটনা',
    'ঐতিহাসিক চুক্তি',
    'শিক্ষা ও নসিহত',
    'পবিত্র কুরআনের কাহিনী',
  ];

  const filteredScripts = ISLAMIC_SCRIPT_LIBRARY.filter((item) => {
    const matchesCategory =
      selectedCategory === 'সকল স্ক্রিপ্ট' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Replace entire project with selected script
  const handleLoadFullScript = (script: ScriptItem) => {
    // Generate fresh unique IDs to avoid key collisions
    const freshScenes: Scene[] = script.scenes.map((s, idx) => ({
      ...s,
      id: `script-${script.id}-${Date.now()}-${idx}`,
      sceneNumber: idx + 1,
    }));
    setScenes(freshScenes);
    setCurrentSceneIndex(0);
    setLoadedSuccessId(script.id);
    setTimeout(() => {
      setLoadedSuccessId(null);
      onClose();
    }, 900);
  };

  // Add single scene to current project
  const handleAddSingleScene = (scene: Scene) => {
    const nextNum = scenes.length + 1;
    const freshScene: Scene = {
      ...scene,
      id: `added-scene-${Date.now()}`,
      sceneNumber: nextNum,
    };
    setScenes((prev) => [...prev, freshScene]);
  };

  // JSON Paste Handler
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
        setTimeout(() => {
          setPasteSuccess(false);
          onClose();
        }, 1200);
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
              onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto cinematic-card-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-sans font-bold text-slate-100 flex items-center gap-2">
                ইসলামিক স্ক্রিপ্ট লাইব্রেরি (Islamic Story Library)
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  {ISLAMIC_SCRIPT_LIBRARY.length} টি প্রস্তুত স্ক্রিপ্ট
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                ইসলামিক শর্টস ও রিলস ভিডিওর জন্য রেডিমেড বাংলা গল্প ও সাবটাইটেল সমূহ
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

        {/* Navigation Tabs (Library vs JSON Config) */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span>প্রস্তুত স্ক্রিপ্টসমূহ</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4 text-amber-500" />
            <span>কাস্টম JSON ইম্পোর্ট / ব্যাকআপ</span>
          </button>
        </div>

        {/* Tab 1: Islamic Script Library */}
        {activeTab === 'library' && (
          <div className="flex flex-col flex-1 overflow-hidden p-5 gap-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="স্ক্রিপ্ট বা বিষয় দিয়ে খুঁজুন (যেমন: উমর, আসহাবে কাহাফ, তওবা)..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-sans text-slate-200 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                  >
                    মুছে ফেলুন
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-sans font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Script Cards List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar">
              {filteredScripts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-sans text-xs">
                  কোনো স্ক্রিপ্ট পাওয়া যায়নি। অন্য ক্যাটাগরি বা বিষয় দিয়ে ট্রাই করুন।
                </div>
              ) : (
                filteredScripts.map((script) => {
                  const isExpanded = expandedScriptId === script.id;
                  const isLoaded = loadedSuccessId === script.id;

                  return (
                    <div
                      key={script.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-all duration-300"
                    >
                      {/* Top Header of Script Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans font-extrabold text-slate-100 text-sm">
                              {script.title}
                            </span>
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold font-sans">
                              {script.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-sans leading-relaxed">
                            {script.description}
                          </p>
                        </div>

                        {/* Direct (+) Load Button */}
                        <button
                          onClick={() => handleLoadFullScript(script)}
                          className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-sans text-xs font-bold transition-all duration-300 cursor-pointer shadow-md ${
                            isLoaded
                              ? 'bg-green-500 text-slate-950 animate-bounce'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 hover:shadow-amber-500/20 active:scale-95'
                          }`}
                        >
                          {isLoaded ? (
                            <>
                              <Check className="w-4 h-4 text-slate-950" />
                              <span>লোড হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                              <span>স্টোরিবোর্ডে যোগ করুন (+)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Tags & Meta details */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-850 pt-2 text-[11px] font-sans text-slate-400">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Film className="w-3.5 h-3.5 text-amber-500" />
                          <span>{script.scenes.length} টি দৃশ্য</span>
                          <span>•</span>
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>প্রায় {script.totalDuration} সেকেন্ড</span>
                        </div>

                        {/* Expand Toggle */}
                        <button
                          onClick={() =>
                            setExpandedScriptId(isExpanded ? null : script.id)
                          }
                          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                        >
                          <span>{isExpanded ? 'দৃশ্য তালিকা লুকান' : 'দৃশ্যসমূহ বিস্তারিত দেখুন'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Expanded Scenes Details */}
                      {isExpanded && (
                        <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-850 bg-slate-900/60 p-3 rounded-xl">
                          <span className="text-[11px] font-sans font-bold text-amber-400 mb-1">
                            স্ক্রিপ্টের দৃশ্য ও সাবটাইটেল বিবরণ:
                          </span>
                          {script.scenes.map((sc, sIdx) => (
                            <div
                              key={sc.id || sIdx}
                              className="flex items-start justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80"
                            >
                              <div className="flex items-start gap-2.5 overflow-hidden">
                                <img
                                  src={sc.imageUrl}
                                  alt={sc.title}
                                  className="w-12 h-12 object-cover rounded-md shrink-0 border border-slate-800"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-xs font-sans font-bold text-slate-200">
                                    দৃশ্য #{sIdx + 1}: {sc.title} ({sc.duration}s)
                                  </span>
                                  <p className="text-[11px] font-sans text-slate-400 leading-snug line-clamp-2">
                                    "{sc.subtitle}"
                                  </p>
                                </div>
                              </div>

                              {/* Single Scene Plus Button */}
                              <button
                                onClick={() => handleAddSingleScene(sc)}
                                className="shrink-0 p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold font-sans"
                                title="শুধুমাত্র এই নির্দিষ্ট দৃশ্যটি আপনার প্রোজেক্টে যোগ করুন"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>দৃশ্যটি যোগ (+)</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Custom JSON Config Manager */}
        {activeTab === 'config' && (
          <div className="flex flex-col flex-1 overflow-y-auto p-5 gap-4 custom-scrollbar">
            <div className="flex flex-col gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-bold text-amber-400 flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-amber-500" />
                  JSON কনফিগ ইম্পোর্ট / পেস্ট করুন:
                </span>
                {pasteSuccess && (
                  <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    স্টোরিবোর্ড লোড সফল!
                  </span>
                )}
              </div>

              <textarea
                value={pastedJson}
                onChange={(e) => {
                  setPastedJson(e.target.value);
                  setPasteError(null);
                }}
                rows={6}
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
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20 leading-relaxed resize-y"
              />

              {pasteError && (
                <p className="text-xs font-sans text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                  ⚠️ {pasteError}
                </p>
              )}

              <button
                onClick={handleApplyPastedJson}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans text-xs font-bold rounded-xl transition-all duration-300 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                JSON স্টোরিবোর্ড প্রয়োগ করুন
              </button>
            </div>

            {/* Copy / Download / File Import Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={copyConfigToClipboard}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-amber-500" />
                )}
                <span>{copied ? 'কপি হয়েছে!' : 'বর্তমান কনফিগ কপি'}</span>
              </button>

              <button
                onClick={downloadConfigFile}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>.JSON ডাউনলোড</span>
              </button>

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
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>.JSON ফাইল আপলোড</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
