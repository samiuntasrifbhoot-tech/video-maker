import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  Video,
  Download,
  FileCheck,
  Play,
  Layers,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { Scene } from '../types';

interface AiChatPanelProps {
  onImportScenes?: (newScenes: Scene[], title?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface VideoJobState {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    videoUrl: string;
    downloadUrl: string;
    thumbnailUrl: string;
  };
  error?: string;
  videoPayload?: any;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  videoJob?: VideoJobState;
}

export default function AiChatPanel({ onImportScenes, isOpen, onClose }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'আসসালামু আলাইকুম! আমি আপনার AI ইসলামিক ভিডিও অ্যাসিস্ট্যান্ট। যেকোনো বিষয় লিখুন (যেমন: "আসহাবে কাহাফের অলৌকিক ইতিহাস নিয়ে ৩০ সেকেন্ডের রিল বানান")—আমি স্ক্রিপ্ট, সিন স্প্লিটিং, ভয়েসওভার ও ভিডিও রেন্ডার করে তৈরি করে দেব।',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Suggested Prompt Chips
  const promptSuggestions = [
    '🎬 আসহাব-ই-কাহাফকে নিয়ে ৩০ সেকেন্ডের রিল বানান',
    '📜 হযরত আবু বকর (রা:) এর দানশীলতার ঘটনা তৈরি করুন',
    '🕌 পবিত্র কুরআনের সূরা আল-ফীল হস্তী বাহিনীর কাহিনী',
    '⚡ রাসূল (সা:) এর মিরাজের সংক্ষিপ্ত ইতিহাস'
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isTyping) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!customText) setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await response.json();

      if (response.ok) {
        const aiMsgId = `ai-${Date.now()}`;
        const aiMsg: ChatMessage = {
          id: aiMsgId,
          sender: 'ai',
          text: data.replyText || 'আপনার অনুরোধ প্রক্রিয়া করা হয়েছে।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          videoJob: data.shouldGenerateVideo && data.jobId ? {
            jobId: data.jobId,
            status: data.jobStatus?.status || 'queued',
            progress: data.jobStatus?.progress || 10,
            videoPayload: data.videoPayload
          } : undefined
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'ai',
            text: `দুঃখিত: ${data.error || 'উত্তর দিতে সমস্যা হয়েছে।'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('AI Chat request error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'সার্ভারের সাথে সংযোগ স্থাপন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl h-[88vh] flex flex-col overflow-hidden cinematic-glow">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-500 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-950">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-sans font-extrabold text-white flex items-center gap-2">
                AI ইসলামিক রিল ও স্টোরিবোর্ড ক্রিয়েটর
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                  Gemini 3.6
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                স্বয়ংক্রিয়ভাবে স্ক্রিপ্ট, সিন, ভয়েসওভার ও MP4 ভিডিও তৈরি করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 font-sans text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl h-fit shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {/* Render Video Generation Card if present */}
                {msg.videoJob && (
                  <VideoJobCard
                    initialJob={msg.videoJob}
                    onImportScenes={onImportScenes}
                  />
                )}

                <span
                  className={`block text-[10px] mt-2 font-mono ${
                    msg.sender === 'user' ? 'text-slate-900/70 text-right' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="p-2 bg-slate-800 text-slate-300 rounded-2xl h-fit shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl h-fit shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>AI স্ক্রিপ্ট ও রিল প্ল্যানিং তৈরি করছে...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Prompt Suggestions Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] text-amber-400/80 font-bold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> আইডিয়া:
          </span>
          {promptSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              disabled={isTyping}
              className="text-xs font-sans bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 px-3 py-1.5 rounded-xl border border-slate-700/80 shrink-0 transition-all cursor-pointer disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="উদাহরণ: 'আসহাবে কাহাফের ইতিহাস নিয়ে ৩০ সেকেন্ডের রিল বানান'..."
            disabled={isTyping}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Live Job Status & MP4 Download Card inside Chat
function VideoJobCard({
  initialJob,
  onImportScenes
}: {
  initialJob: VideoJobState;
  onImportScenes?: (scenes: Scene[], title?: string) => void;
}) {
  const [job, setJob] = useState<VideoJobState>(initialJob);

  // Poll video rendering job status from backend
  useEffect(() => {
    if (job.status === 'completed' || job.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/job/${job.jobId}`);
        if (res.ok) {
          const updated = await res.json();
          setJob((prev) => ({
            ...prev,
            status: updated.status,
            progress: updated.progress,
            result: updated.result,
            error: updated.error
          }));

          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error('Error polling job status:', e);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [job.jobId, job.status]);

  const handleImportToEditor = () => {
    if (!onImportScenes || !job.videoPayload?.scenes) return;

    const formattedScenes: Scene[] = job.videoPayload.scenes.map((s: any, idx: number) => ({
      id: `scene-${Date.now()}-${idx}`,
      sceneNumber: s.sceneNumber || idx + 1,
      title: s.title || `দৃশ্য ${idx + 1}`,
      subtitle: s.subtitle || '',
      duration: s.duration || 6,
      motionPreset: s.motionPreset || 'ken-burns-in',
      imageUrl: s.imageUrl || 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000'
    }));

    onImportScenes(formattedScenes, job.videoPayload.title);
    alert(`"${job.videoPayload.title || 'রিল'}" এর দৃশ্যগুলো মূল স্টোরিবোর্ড এডিটরে সফলভাবে ইম্পোর্ট করা হয়েছে!`);
  };

  return (
    <div className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner flex flex-col gap-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="font-bold text-xs text-white">
            {job.videoPayload?.title || 'ভিডিও রিল রেন্ডারিং'}
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
            job.status === 'completed'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : job.status === 'failed'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}
        >
          {job.status === 'completed'
            ? 'রেন্ডারিং সম্পন্ন'
            : job.status === 'failed'
            ? 'ব্যর্থ হয়েছে'
            : `প্রসেসিং (${job.progress}%)`}
        </span>
      </div>

      {/* Progress Bar during processing */}
      {job.status !== 'completed' && job.status !== 'failed' && (
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500"
              style={{ width: `${Math.max(5, job.progress)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
            <span>AI ক্যানভাস ফ্রেমিং, ভয়েসওভার এবং MP4 ভিডিও রেন্ডার করছে...</span>
          </p>
        </div>
      )}

      {/* Render Error Message if Failed */}
      {job.status === 'failed' && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{job.error || 'ভিডিও রেন্ডার করতে সমস্যা হয়েছে।'}</span>
        </div>
      )}

      {/* Video Preview & Download links when Completed */}
      {job.status === 'completed' && job.result && (
        <div className="space-y-3 pt-1">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[9/16] max-h-64 mx-auto flex items-center justify-center">
            <video
              src={job.result.downloadUrl}
              controls
              className="w-full h-full object-contain"
              poster={job.result.thumbnailUrl}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <a
              href={`${job.result.downloadUrl}?download=true`}
              download
              className="w-full sm:flex-1 py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>MP4 ডাউনলোড করুন</span>
            </a>

            {onImportScenes && (
              <button
                onClick={handleImportToEditor}
                className="w-full sm:flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>এডিটরে ইম্পোর্ট করুন</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
