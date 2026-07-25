/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  BookOpen,
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  Sparkles,
} from 'lucide-react';
import { Scene } from '../types';
import { INITIAL_SCENES } from '../data';

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
  const [copied, setCopied] = React.useState(false);
  const [showPasteBox, setShowPasteBox] = React.useState(true); // Default open for easy access
  const [pastedJson, setPastedJson] = React.useState('');
  const [pasteError, setPasteError] = React.useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Preset Story 2: Well of Rumah (Uthman R.)
  const uthmanWellStory: Scene[] = [
    {
      id: 'uthman-1',
      sceneNumber: 1,
      title: 'মদিনায় পানির হাহাকার',
      subtitle: 'মদিনায় হিজরতের পর মুসলিমদের জন্য সুপেয় পানির তীব্র সংকট দেখা দিল। শুধু একটি কূপেই মিষ্টি পানি ছিল।',
      imageUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'zoom-in',
      duration: 8,
    },
    {
      id: 'uthman-2',
      sceneNumber: 2,
      title: 'ইহুদি মালিকের কঠিন শর্ত',
      subtitle: 'কূপটির মালিক ছিল এক ইহুদি। সে চড়া মূল্যে মুসলিমদের কাছে পানি বিক্রি করত। গরিব মানুষের পক্ষে তা কেনা অসম্ভব ছিল।',
      imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'pan-left',
      duration: 9,
    },
    {
      id: 'uthman-3',
      sceneNumber: 3,
      title: 'রাসূলুল্লাহ (সাঃ) এর সুসংবাদ',
      subtitle: 'নবীজী বললেন... তোমাদের মধ্যে কে রুমা কূপ কিনে আল্লাহর জন্য ওয়াকফ করবে, যার বিনিময়ে জান্নাতে তার জন্য উত্তম প্রস্রবণ থাকবে?',
      imageUrl: 'https://images.unsplash.com/photo-1590076212957-c0f209564883?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'zoom-out',
      duration: 10,
    },
    {
      id: 'uthman-4',
      sceneNumber: 4,
      title: 'উসমানের দানশীলতা',
      subtitle: 'একথা শুনে উসমান (রাঃ) ইহুদির কাছে গেলেন। তিনি কূপটির অর্ধেক মালিকানা বিশাল মূল্যে কিনে নিলেন।',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'pan-right',
      duration: 8,
    },
    {
      id: 'uthman-5',
      sceneNumber: 5,
      title: 'বিনামূল্যে পানি বিতরণ',
      subtitle: 'উসমানের মালিকানার দিনে সমস্ত মুসলিম ও মদিনাবাসী বিনামূল্যে দুই দিনের সুপেয় পানি সংগ্রহ করত।',
      imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'tilt-up',
      duration: 9,
    },
    {
      id: 'uthman-6',
      sceneNumber: 6,
      title: 'জান্নাতের সুসংবাদ',
      subtitle: 'পরে তিনি পুরো কূপটিই কিনে নিয়ে চিরতরে ওয়াকফ করে দিলেন। আজও মদিনায় উসমান (রাঃ) এর নামে সেই বাগান ও কূপ রয়েছে।',
      imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'tilt-down',
      duration: 10,
    },
  ];

  // Preset Story 3: Hilf al-Fudul (Peace pact)
  const hilfAlFudulStory: Scene[] = [
    {
      id: 'hilf-1',
      sceneNumber: 1,
      title: 'জাহেলিয়াতের মক্কা',
      subtitle: 'মক্কায় তখন কোনো সুনির্দিষ্ট আইন ছিল না। দুর্বল ও বহিরাগতদের উপর প্রায়ই নির্যাতন ও অবিচার করা হতো।',
      imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'zoom-in',
      duration: 8,
    },
    {
      id: 'hilf-2',
      sceneNumber: 2,
      title: 'ইয়েমেনি ব্যবসায়ীর কান্না',
      subtitle: 'এক ইয়েমেনি ব্যবসায়ীর পণ্য কিনে নিয়ে মক্কার প্রভাবশালী আস বিন ওয়ায়েল মূল্য দিতে অস্বীকার করল। ব্যবসায়ী পাহাড়ের চূড়ায় উঠে বিচার চাইলেন।',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'pan-left',
      duration: 10,
    },
    {
      id: 'hilf-3',
      sceneNumber: 3,
      title: 'উদারমনা যুবকদের সম্মিলন',
      subtitle: 'একথা শুনে তরুণ মুহাম্মদ (সাঃ) এবং তাঁর চাচা যুবায়রের উদ্যোগে মক্কার ন্যায়নিষ্ঠ যুবকেরা আব্দুল্লাহ ইবনে জুদআনের ঘরে মিলিত হলেন।',
      imageUrl: 'https://images.unsplash.com/photo-1590076212957-c0f209564883?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'zoom-out',
      duration: 9,
    },
    {
      id: 'hilf-4',
      sceneNumber: 4,
      title: 'ঐতিহাসিক শান্তি চুক্তি',
      subtitle: 'তারা শপথ নিলেন... মক্কায় আমরা কোনো অত্যাচারী থাকতে দেব না। মজলুম যে গোত্রেরই হোক, আমরা তাকে সাহায্য করব।',
      imageUrl: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'pan-right',
      duration: 9,
    },
    {
      id: 'hilf-5',
      sceneNumber: 5,
      title: 'ন্যায়বিচার প্রতিষ্ঠা',
      subtitle: 'এই চুক্তির পর আস বিন ওয়ায়েল পণ্য ফেরত দিতে বাধ্য হলো। শান্তি ও নিরাপত্তা ফিরে এলো মক্কার অলিতে গলিতে।',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'tilt-up',
      duration: 8,
    },
    {
      id: 'hilf-6',
      sceneNumber: 6,
      title: 'রাসূলুল্লাহর চিরন্তন গর্ব',
      subtitle: 'নবীজী নবুওয়াতের পরেও বলতেন... আব্দুল্লাহর ঘরে সেই চুক্তির বদলে যদি আমাকে লাল রঙের মূল্যবান উটও দেওয়া হতো, তবুও আমি চুক্তি ভাঙতাম না।',
      imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
      isCustomImage: false,
      motionPreset: 'tilt-down',
      duration: 10,
    },
  ];

  const handleLoadPreset = (presetScenes: Scene[]) => {
    setScenes(presetScenes);
    setCurrentSceneIndex(0);
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
      alert('ফাইল ডাউনলোড করতে ব্যর্থ হয়েছে। আপনি বোতাম থেকে কনফিগ কপি করে সরাসরি পেস্ট করতে পারেন।');
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
      {/* Preloaded Stories Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h2 className="font-sans font-bold text-slate-100 text-base">ইসলামিক স্ক্রিপ্ট লাইব্রেরি</h2>
        </div>

        <div className="flex flex-col gap-2">
          {/* Preset 1 (Hazrat Umar) */}
          <button
            onClick={() => handleLoadPreset(INITIAL_SCENES)}
            className="flex items-center justify-between text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-950/90 transition-all duration-300 group"
          >
            <div className="flex flex-col gap-1">
              <span className="font-sans font-bold text-slate-200 text-sm group-hover:text-amber-400 transition-colors">
                ১. উমরের রাতে ভ্রমণ ও ক্ষুধার্ত শিশু
              </span>
              <span className="font-sans text-[11px] text-slate-400">
                খলিফা হযরত উমর (রা:) এবং ক্ষুধার্ত শিশুর বেদনাদায়ক আটার বস্তার সেই মহান কাহিনী।
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-amber-500 group-hover:animate-pulse" />
          </button>

          {/* Preset 2 (Uthman Well) */}
          <button
            onClick={() => handleLoadPreset(uthmanWellStory)}
            className="flex items-center justify-between text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-950/90 transition-all duration-300 group"
          >
            <div className="flex flex-col gap-1">
              <span className="font-sans font-bold text-slate-200 text-sm group-hover:text-amber-400 transition-colors">
                ২. উসমানের দান ও রুমা কূপ (Rumah Well)
              </span>
              <span className="font-sans text-[11px] text-slate-400">
                মদিনায় সুপেয় পানির সংকট মেটাতে ইহুদির থেকে কূপ ক্রয় ও মুসলিমদের জান্নাতের ওয়াদা।
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-amber-500 group-hover:animate-pulse" />
          </button>

          {/* Preset 3 (Hilf al-Fudul) */}
          <button
            onClick={() => handleLoadPreset(hilfAlFudulStory)}
            className="flex items-center justify-between text-left p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-950/90 transition-all duration-300 group"
          >
            <div className="flex flex-col gap-1">
              <span className="font-sans font-bold text-slate-200 text-sm group-hover:text-amber-400 transition-colors">
                ৩. হিলফুল ফুজুল ও শান্তি রক্ষা চুক্তি
              </span>
              <span className="font-sans text-[11px] text-slate-400">
                রাসূলুল্লাহর যৌবনে মক্কায় মজলুমের অধিকার প্রতিষ্ঠা ও অবিচার রুখে দাঁড়ানোর ইতিহাস।
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-amber-500 group-hover:animate-pulse" />
          </button>
        </div>
      </div>

      {/* Import/Export Config section */}
      <div className="flex flex-col gap-3 border-t border-slate-800/60 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-sans text-slate-300 font-bold">JSON কোড পেস্ট / ইম্পোর্ট করুন:</span>
          </div>
          <span className="text-[10px] text-amber-400 font-sans font-semibold">কাস্টম স্ক্রিপ্ট সাপোর্ট</span>
        </div>

        {/* Informative Explanation of Config Import/Export */}
        <p className="text-[11px] text-slate-400 font-sans leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          💡 <strong className="text-amber-400">সহজ উপায়ে স্ক্রিপ্ট লোড করুন:</strong> আপনার তৈরি করা স্টোরিবোর্ড ব্যাকআপ কোড নিচের বক্সে পেস্ট করে <strong className="text-white">"JSON স্টোরিবোর্ড লোড করুন"</strong> বোতামে চাপুন। অথবা সংরক্ষিত .json ফাইল ব্যাকআপ ডাউনলোড / আপলোড করুন।
        </p>

        {/* Direct JSON Paste Textarea Section */}
        <div className="flex flex-col gap-2 bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-sans text-slate-300 font-semibold flex items-center gap-1.5">
              <span>📋 এখানে আপনার JSON কোড পেস্ট করুন:</span>
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
            rows={4}
            placeholder={`এখানে আপনার JSON কোড সরাসরি পেস্ট (Ctrl+V) করুন...
যেমন:
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
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans text-xs font-bold rounded-lg transition-all duration-300 shadow-md shadow-amber-500/10 active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            JSON স্টোরিবোর্ড লোড করুন
          </button>
        </div>

        {/* Copy / Download / File Upload helpers */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {/* Copy Config */}
          <button
            onClick={copyConfigToClipboard}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-sans font-medium transition-all duration-300 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
            {copied ? 'কপি হয়েছে' : 'বর্তমান কনফিগ কপি করুন'}
          </button>

          {/* Download Config */}
          <button
            onClick={downloadConfigFile}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-sans font-medium transition-all duration-300 active:scale-95"
          >
            <Download className="w-4 h-4 text-amber-500" />
            .JSON ফাইল ডাউনলোড
          </button>
        </div>

        {/* Import file upload button as secondary fallback */}
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-sans font-medium transition-all duration-300 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            অথবা .JSON ফাইল আপলোড করুন
          </button>
        </div>
      </div>
    </div>
  );
}
