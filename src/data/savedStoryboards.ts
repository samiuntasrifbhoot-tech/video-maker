/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene } from '../types';

export interface SavedStoryboardItem {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  scenes: Scene[];
  totalDuration: number;
}

const STORAGE_KEY = 'islamic_reels_saved_storyboards';

export function getSavedStoryboards(): SavedStoryboardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading saved storyboards:', err);
    return [];
  }
}

export function saveStoryboardToLibrary(item: {
  title: string;
  description?: string;
  scenes: Scene[];
}): SavedStoryboardItem {
  const existing = getSavedStoryboards();
  const totalDuration = item.scenes.reduce((acc, s) => acc + (s.duration || 5), 0);

  const newItem: SavedStoryboardItem = {
    id: `saved-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: item.title || 'আমার ইসলামিক রিলস',
    description: item.description || `${item.scenes.length} টি দৃশ্য সম্বলিত এআই ভিডিও স্টোরিবোর্ড`,
    category: 'আমার সেভ করা রিলস',
    createdAt: new Date().toISOString(),
    scenes: item.scenes,
    totalDuration,
  };

  const updated = [newItem, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving storyboard to localStorage:', err);
  }
  return newItem;
}

export function deleteSavedStoryboard(id: string): SavedStoryboardItem[] {
  const existing = getSavedStoryboards();
  const updated = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting storyboard:', err);
  }
  return updated;
}
