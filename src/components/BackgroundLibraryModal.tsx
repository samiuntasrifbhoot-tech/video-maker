/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  Search,
  Check,
  X,
  Sparkles,
  Layers,
  Filter,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import {
  BACKGROUND_IMAGE_LIBRARY,
  BackgroundImageItem
} from '../data/backgroundImageLibrary';

interface BackgroundLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, title?: string) => void;
  onApplyToAllScenes?: (imageUrl: string) => void;
  currentImageUrl?: string;
}

export default function BackgroundLibraryModal({
  isOpen,
  onClose,
  onSelectImage,
  onApplyToAllScenes,
  currentImageUrl,
}: BackgroundLibraryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(currentImageUrl || null);
  const [previewZoomUrl, setPreviewZoomUrl] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'সব ব্যাকগ্রাউন্ড' },
    { id: 'desert', label: 'মরুভূমি ও প্রকৃতি' },
    { id: 'mosque', label: 'মসজিদ ও গম্বুজ' },
    { id: 'ancient', label: 'প্রাচীন নগরী ও ইতিহাস' },
    { id: 'night', label: 'তারাময় আকাশ ও রাত' },
    { id: 'manuscript', label: 'কুরআন ও ক্যালিগ্রাফি' },
    { id: 'light', label: 'স্বর্গীয় আলো ও আবহ' },
  ];

  const filteredImages = useMemo(() => {
    return BACKGROUND_IMAGE_LIBRARY.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCategoryLabel = item.categoryLabel.toLowerCase().includes(q);
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));

      return matchTitle || matchCategoryLabel || matchTag;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden cinematic-glow">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-500 rounded-2xl shadow-lg shadow-amber-500/20 text-slate-950">
              <ImageIcon className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-sans font-extrabold text-white flex items-center gap-2">
                HD ব্যাকগ্রাউন্ড ইমেজ লাইব্রেরি
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                  {BACKGROUND_IMAGE_LIBRARY.length}+ Assets
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                আপনার দৃশ্যের জন্য উপযুক্ত এইচডি ব্যাকগ্রাউন্ড সিলেক্ট করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-col gap-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সার্চ করুন (যেমন: গুহা, মরুভূমি, রাত, মসজিদ, কাবা, কুরআন, আলো)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                মুছে ফেলুন
              </button>
            )}
          </div>

          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Images Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {filteredImages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center gap-2 text-slate-500">
              <Filter className="w-8 h-8 opacity-40" />
              <p className="text-sm font-sans font-semibold">কোনো ছবি পাওয়া যায়নি</p>
              <p className="text-xs text-slate-600">অন্য কোনো কিওয়ার্ড লিখে চেষ্টা করুন</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {filteredImages.map((img) => {
                const isSelected = selectedImage === img.imageUrl;

                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img.imageUrl)}
                    className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer aspect-video bg-slate-950 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/20 scale-[1.02]'
                        : 'border-slate-800 hover:border-slate-600 hover:scale-[1.01]'
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Checkmark overlay */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 p-1 rounded-full shadow-lg">
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      </div>
                    )}

                    {/* Title & Category Label */}
                    <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
                      <span className="text-[11px] font-sans font-bold text-white line-clamp-1 leading-tight">
                        {img.title}
                      </span>
                      <span className="text-[9px] font-sans text-amber-400 font-medium opacity-90">
                        {img.categoryLabel}
                      </span>
                    </div>

                    {/* Expand Zoom Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewZoomUrl(img.imageUrl);
                      }}
                      className="absolute top-2 left-2 p-1.5 bg-slate-950/70 text-slate-300 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="ছবি জুম করে দেখুন"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {selectedImage && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>১টি ব্যাকগ্রাউন্ড নির্বাচিত</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onApplyToAllScenes && selectedImage && (
              <button
                type="button"
                onClick={() => {
                  if (selectedImage) {
                    onApplyToAllScenes(selectedImage);
                    onClose();
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-sans font-bold rounded-xl border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>সব দৃশ্যগুলোতে প্রয়োগ করুন</span>
              </button>
            )}

            <button
              type="button"
              disabled={!selectedImage}
              onClick={() => {
                if (selectedImage) {
                  onSelectImage(selectedImage);
                  onClose();
                }
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-sans font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>এই দৃশ্যে সেট করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Modal Preview */}
      {previewZoomUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewZoomUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700">
            <img
              src={previewZoomUrl}
              alt="Zoom Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setPreviewZoomUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
