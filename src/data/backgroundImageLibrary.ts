/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BackgroundImageItem {
  id: string;
  title: string;
  category: 'desert' | 'mosque' | 'ancient' | 'night' | 'manuscript' | 'light';
  categoryLabel: string;
  imageUrl: string;
  tags: string[];
}

export const BACKGROUND_IMAGE_LIBRARY: BackgroundImageItem[] = [
  // --- CATEGORY 1: desert (মরুভূমি ও প্রকৃতি) ---
  {
    id: 'bg-d1',
    title: 'স্বর্ণালী মরুভূমির বালিয়াড়ি',
    category: 'desert',
    categoryLabel: 'মরুভূমি ও প্রকৃতি',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    tags: ['desert', 'dunes', 'sand', 'golden', 'মরুভূমি', 'বালিয়াড়ি', 'সাহারা'],
  },
  {
    id: 'bg-d2',
    title: 'মরূদ্যান ও খেজুর বাগান',
    category: 'desert',
    categoryLabel: 'মরুভূমি ও প্রকৃতি',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    tags: ['oasis', 'palms', 'water', 'desert', 'মরূদ্যান', 'খেজুর', 'পানি'],
  },
  {
    id: 'bg-d3',
    title: 'সূর্যাস্তে লালচে বালিয়াড়ি',
    category: 'desert',
    categoryLabel: 'মরুভূমি ও প্রকৃতি',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    tags: ['sunset', 'red sand', 'dunes', 'সূর্যাস্ত', 'লাল বালি'],
  },
  {
    id: 'bg-d4',
    title: 'নির্জন পর্বতময় মরুভূমি',
    category: 'desert',
    categoryLabel: 'মরুভূমি ও প্রকৃতি',
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    tags: ['mountains', 'rocky desert', 'canyon', 'পাহাড়', 'মরু পর্বত'],
  },
  {
    id: 'bg-d5',
    title: 'মরুভূমির দীর্ঘ কাফেলা পথ',
    category: 'desert',
    categoryLabel: 'মরুভূমি ও প্রকৃতি',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    tags: ['caravan', 'camels', 'path', 'journey', 'কাফেলা', 'উট', 'পথ'],
  },
  {
    id: 'bg-d6',
    title: 'বিশাল পাথুরে ক্যানিয়ন',
    category: 'desert',
    categoryLabel: 'মরুভূমি ও প্রকৃতি',
    imageUrl: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80',
    tags: ['canyon', 'cliffs', 'valley', 'ক্যানিয়ন', 'উপত্যকা'],
  },
  {
    id: 'bg-d7',
    title: 'মরুভূমির ঊষালগ্ন',
    category: 'desert',
    categoryLabel: 'মরুভূমি ও প্রকৃতি',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    tags: ['dawn', 'morning', 'haze', 'ভোর', 'কুয়াশা'],
  },

  // --- CATEGORY 2: mosque (মসজিদ, গম্বুজ ও মিনার) ---
  {
    id: 'bg-m1',
    title: 'পবিত্র কাবা শরিফ চত্বর',
    category: 'mosque',
    categoryLabel: 'মসজিদ ও গম্বুজ',
    imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
    tags: ['kaaba', 'mecca', 'mosque', 'কাবা', 'মক্কা', 'মসজিদ', 'তওয়াফ'],
  },
  {
    id: 'bg-m2',
    title: 'মসজিদে নববীর মনোরম মিনার',
    category: 'mosque',
    categoryLabel: 'মসজিদ ও গম্বুজ',
    imageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80',
    tags: ['madinah', 'minaret', 'prophet mosque', 'মদিনা', 'মিনার'],
  },
  {
    id: 'bg-m3',
    title: 'ঐতিহাসিক গম্বুজ ও সুফিয়ানা স্থাপত্য',
    category: 'mosque',
    categoryLabel: 'মসজিদ ও গম্বুজ',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    tags: ['dome', 'arch', 'architecture', 'গম্বুজ', 'খিলান'],
  },
  {
    id: 'bg-m4',
    title: 'সূর্যাস্তে ব্লু মস্ক মিনার',
    category: 'mosque',
    categoryLabel: 'মসজিদ ও গম্বুজ',
    imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
    tags: ['sunset mosque', 'istanbul', 'blue mosque', 'সূর্যাস্ত'],
  },
  {
    id: 'bg-m5',
    title: 'মসজিদের মার্বেল চত্বরের প্রতিফলন',
    category: 'mosque',
    categoryLabel: 'মসজিদ ও গম্বুজ',
    imageUrl: 'https://images.unsplash.com/photo-1582281227297-f01cf4e39436?auto=format&fit=crop&w=1200&q=80',
    tags: ['reflection', 'courtyard', 'marble', 'প্রতিফলন', 'চত্বর'],
  },
  {
    id: 'bg-m6',
    title: 'আলোঝলমলে রাতের মসজিদ',
    category: 'mosque',
    categoryLabel: 'মসজিদ ও গম্বুজ',
    imageUrl: 'https://images.unsplash.com/photo-1578898835026-6644485590a3?auto=format&fit=crop&w=1200&q=80',
    tags: ['night mosque', 'lanterns', 'illumination', 'রাতের মসজিদ', 'আলো'],
  },

  // --- CATEGORY 3: ancient (প্রাচীন নগরী ও ইতিহাস) ---
  {
    id: 'bg-a1',
    title: 'অলৌকিক পর্বতের প্রাচীন গুহা',
    category: 'ancient',
    categoryLabel: 'প্রাচীন নগরী ও ইতিহাস',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    tags: ['cave', 'kahf', 'stone', 'ancient', 'গুহা', 'আসহাবে কাহাফ', 'পাথর'],
  },
  {
    id: 'bg-a2',
    title: 'প্রাচীন আরবের মাটির দুর্গ ও বাজার',
    category: 'ancient',
    categoryLabel: 'প্রাচীন নগরী ও ইতিহাস',
    imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
    tags: ['ancient city', 'fortress', 'bazaar', 'প্রাচীন নগরী', 'দুর্গ'],
  },
  {
    id: 'bg-a3',
    title: 'ঐতিহাসিক পাথরের খোদাই করা তোরণ',
    category: 'ancient',
    categoryLabel: 'প্রাচীন নগরী ও ইতিহাস',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    tags: ['archway', 'stone gate', 'ancient ruin', 'তোরণ', 'দ্বার'],
  },
  {
    id: 'bg-a4',
    title: 'বিশাল প্রাচীন প্রাসাদের প্রাঙ্গণ',
    category: 'ancient',
    categoryLabel: 'প্রাচীন নগরী ও ইতিহাস',
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
    tags: ['palace', 'court', 'royal', 'প্রাসাদ', 'রাজধানী'],
  },
  {
    id: 'bg-a5',
    title: 'প্রাচীন মাটির প্রদীপ ও সলতে',
    category: 'ancient',
    categoryLabel: 'প্রাচীন নগরী ও ইতিহাস',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    tags: ['lantern', 'clay lamp', 'oil lamp', 'প্রদীপ', 'আলো'],
  },

  // --- CATEGORY 4: night (তারাময় আকাশ ও রাত) ---
  {
    id: 'bg-n1',
    title: 'মরুভূমির ওপর তারাভরা আকাশ (ছায়াপথ)',
    category: 'night',
    categoryLabel: 'তারাময় আকাশ ও রাত',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    tags: ['milky way', 'stars', 'night', 'sky', 'তারাময়', 'আকাশ', 'ছায়াপথ'],
  },
  {
    id: 'bg-n2',
    title: 'পবিত্র হিজরি চাঁদের আলো',
    category: 'night',
    categoryLabel: 'তারাময় আকাশ ও রাত',
    imageUrl: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=1200&q=80',
    tags: ['crescent', 'moon', 'night', 'চাঁদ', 'জোছনা', 'হিজরি'],
  },
  {
    id: 'bg-n3',
    title: 'গভীর রাতে নির্জন পাহাড়ি প্রান্তর',
    category: 'night',
    categoryLabel: 'তারাময় আকাশ ও রাত',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    tags: ['night mountain', 'darkness', 'silence', 'রাত', 'পাহাড়'],
  },
  {
    id: 'bg-n4',
    title: 'জ্যোৎস্না প্লাবিত বালিয়াড়ি',
    category: 'night',
    categoryLabel: 'তারাময় আকাশ ও রাত',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    tags: ['moonlight dunes', 'night desert', 'জোছনা'],
  },

  // --- CATEGORY 5: manuscript (কুরআন, ক্যালিগ্রাফি ও পাণ্ডুলিপি) ---
  {
    id: 'bg-k1',
    title: 'সোনার হরফে রেহালের ওপর পবিত্র কুরআন',
    category: 'manuscript',
    categoryLabel: 'কুরআন ও ক্যালিগ্রাফি',
    imageUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80',
    tags: ['quran', 'rehal', 'holy book', 'কুরআন', 'তিলাওয়াত', 'কিতাব'],
  },
  {
    id: 'bg-k2',
    title: 'প্রাচীন চামড়ার হাতে লেখা পাণ্ডুলিপি',
    category: 'manuscript',
    categoryLabel: 'কুরআন ও ক্যালিগ্রাফি',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
    tags: ['manuscript', 'parchment', 'calligraphy', 'পাণ্ডুলিপি', 'কালি'],
  },
  {
    id: 'bg-k3',
    title: 'ইসলামিক জ্যামিতিক নকশা ও কারুকাজ',
    category: 'manuscript',
    categoryLabel: 'কুরআন ও ক্যালিগ্রাফি',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    tags: ['pattern', 'art', 'carving', 'নকশা', 'কারুকাজ'],
  },

  // --- CATEGORY 6: light (আলো, ধোঁয়া ও স্বর্গীয় আবহ) ---
  {
    id: 'bg-l1',
    title: 'গুহার ছাদ থেকে স্বর্গীয় আলোর দ্যুতি',
    category: 'light',
    categoryLabel: 'স্বর্গীয় আলো ও আবহ',
    imageUrl: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1200&q=80',
    tags: ['light beam', 'ray', 'divine', 'cave light', 'আলো', 'রশ্মি'],
  },
  {
    id: 'bg-l2',
    title: 'ভোরের সোনালী মেঘ ও পর্বতচূড়া',
    category: 'light',
    categoryLabel: 'স্বর্গীয় আলো ও আবহ',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    tags: ['clouds', 'sunrise', 'golden peak', 'মেঘ', 'ভোর'],
  },
  {
    id: 'bg-l3',
    title: 'রহস্যময় কুয়াশাচ্ছন্ন প্রাচীন পথ',
    category: 'light',
    categoryLabel: 'স্বর্গীয় আলো ও আবহ',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    tags: ['mist', 'path', 'fog', 'কুয়াশা', 'পথ'],
  }
];

/**
 * Helper function to match the best image based on scene title or subtitle keywords
 */
export function matchBestBackgroundImage(queryText: string): string {
  if (!queryText) return BACKGROUND_IMAGE_LIBRARY[0].imageUrl;
  
  const textLower = queryText.toLowerCase();

  // Find exact tag match
  for (const item of BACKGROUND_IMAGE_LIBRARY) {
    for (const tag of item.tags) {
      if (textLower.includes(tag.toLowerCase())) {
        return item.imageUrl;
      }
    }
  }

  // Fallback keyword rules
  if (textLower.includes('cave') || textLower.includes('গুহা') || textLower.includes('কাহাফ')) {
    return BACKGROUND_IMAGE_LIBRARY.find((i) => i.id === 'bg-a1')?.imageUrl || BACKGROUND_IMAGE_LIBRARY[0].imageUrl;
  }
  if (textLower.includes('night') || textLower.includes('star') || textLower.includes('রাত') || textLower.includes('আকাশ')) {
    return BACKGROUND_IMAGE_LIBRARY.find((i) => i.id === 'bg-n1')?.imageUrl || BACKGROUND_IMAGE_LIBRARY[0].imageUrl;
  }
  if (textLower.includes('mosque') || textLower.includes('kabah') || textLower.includes('মসজিদ') || textLower.includes('কাবা')) {
    return BACKGROUND_IMAGE_LIBRARY.find((i) => i.id === 'bg-m1')?.imageUrl || BACKGROUND_IMAGE_LIBRARY[0].imageUrl;
  }
  if (textLower.includes('quran') || textLower.includes('কুরআন') || textLower.includes('বই') || textLower.includes('পাণ্ডুলিপি')) {
    return BACKGROUND_IMAGE_LIBRARY.find((i) => i.id === 'bg-k1')?.imageUrl || BACKGROUND_IMAGE_LIBRARY[0].imageUrl;
  }

  // Pick deterministic item based on string length hash
  const idx = Math.abs(queryText.length) % BACKGROUND_IMAGE_LIBRARY.length;
  return BACKGROUND_IMAGE_LIBRARY[idx].imageUrl;
}
