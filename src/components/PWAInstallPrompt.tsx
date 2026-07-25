import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, CheckCircle, HelpCircle, X, ExternalLink, Code2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'github'>('android');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-sans font-extrabold rounded-xl shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        title="মোবাইলে অ্যাপ হিসেবে ইনস্টল বা ডাউনলোড করার নিয়ম"
      >
        <Smartphone className="w-4 h-4 text-slate-950" />
        <span>{isInstalled ? 'অ্যাপ ইনস্টল করা হয়েছে' : 'মোবাইল অ্যাপ ইনস্টল'}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col gap-5 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-white">
                  মোবাইলে অ্যাপ ইনস্টল ও ডাউনলোড নির্দেশিকা
                </h3>
                <p className="text-xs text-slate-400">
                  ফোন স্ক্রিনে শর্টকাট অ্যাপ হিসেবে বা গিটহাব থেকে সরাসরি ব্যবহারের গাইড
                </p>
              </div>
            </div>

            {/* Tab selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-2 text-xs font-sans font-bold rounded-lg transition-all ${
                  activeTab === 'android'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                এন্ড্রয়েড (Android)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-2 text-xs font-sans font-bold rounded-lg transition-all ${
                  activeTab === 'ios'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                আইফোন (iOS)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('github')}
                className={`py-2 text-xs font-sans font-bold rounded-lg transition-all ${
                  activeTab === 'github'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GitHub / APK
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'android' && (
              <div className="flex flex-col gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">১</span>
                  <p>আপনার মোবাইল ফোনের Chrome বা Edge ব্রাউজারে লিংকটি ওপেন করুন।</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">২</span>
                  <p>ব্রাউজারের ডানপাশের ওপরের ৩-ডট মেনু (⋮) অপশনে ট্যাপ করুন।</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">৩</span>
                  <p className="font-semibold text-amber-300">
                    "Add to Home screen" বা "Install app" বাটনে চাপ দিন।
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">৪</span>
                  <p>আপনার হোম স্ক্রিনে অরিজিনাল অ্যাপ আইকন যুক্ত হয়ে যাবে!</p>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="flex flex-col gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">১</span>
                  <p>আইফোনের Safari ব্রাউজারে সাইটটি ওপেন করুন।</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">২</span>
                  <p className="flex items-center gap-1">
                    নিচের শেয়ার আইকন <Share className="w-3.5 h-3.5 text-amber-400" /> (Share button) চাপুন।
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">৩</span>
                  <p className="font-semibold text-amber-300 flex items-center gap-1">
                    মেনু থেকে <PlusSquare className="w-3.5 h-3.5 text-amber-400" /> "Add to Home Screen" নির্বাচন করুন।
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'github' && (
              <div className="flex flex-col gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Code2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p><strong>GitHub Export:</strong> AI Studio সেটিং থেকে Export to GitHub বা ZIP অপশন দিয়ে পুরো সোর্স কোড ডাউনলোড করতে পারবেন।</p>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300/90 leading-relaxed overflow-x-auto">
                  npm install<br/>
                  npm run build<br/>
                  npx cap add android # Capacitor দিয়ে APK বানাতে
                </div>
                <p className="text-[11px] text-slate-400">
                  প্রজেক্টটিতে অরিজিনাল PWA `manifest.json`, Service Worker, এবং `512x512` অ্যাপ আইকন সম্পূর্ণ যুক্ত করা রয়েছে।
                </p>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-sans font-bold text-xs transition-colors"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
}
