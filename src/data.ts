/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene } from './types';

export const INITIAL_SCENES: Scene[] = [
  {
    id: 'scene-1',
    sceneNumber: 1,
    title: 'রাতের অন্ধকার পথ',
    subtitle: 'খলিফা রাতের অন্ধকারে একা হাঁটছেন। কেউ জানে না... তিনি কোথায় যাচ্ছেন।',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    isCustomImage: false,
    motionPreset: 'zoom-in',
    duration: 8,
  },
  {
    id: 'scene-2',
    sceneNumber: 2,
    title: 'শিশুর কান্না ও মায়ের বিষাদ',
    subtitle: 'এক বাড়ি থেকে শিশুর কান্নার আওয়াজ আসছে। ভেতরে এক মা... খালি পাত্রে পানি গরম করছেন। উমর জিজ্ঞেস করলেন... কী রান্না হচ্ছে?',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    isCustomImage: false,
    motionPreset: 'pan-left',
    duration: 10,
  },
  {
    id: 'scene-3',
    sceneNumber: 3,
    title: 'ভুলিয়ে রাখার ছলনা',
    subtitle: 'মা বললেন... পানি। শিশুরা যেন ভুলে যায়... আজ খাবার নেই। ঘুম পাড়াচ্ছি তাদের।',
    imageUrl: 'https://images.unsplash.com/photo-1582281227297-f01cf4e39436?auto=format&fit=crop&w=1200&q=80',
    isCustomImage: false,
    motionPreset: 'tilt-up',
    duration: 8,
  },
  {
    id: 'scene-4',
    sceneNumber: 4,
    title: 'খলিফার অশ্রুপাত',
    subtitle: 'এই কথা শুনে উমরের চোখে পানি এলো। তিনি নিজেই... মুসলিমদের খলিফা। অথচ তাঁর রাজ্যে একটি শিশু না খেয়ে ঘুমাচ্ছে।',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    isCustomImage: false,
    motionPreset: 'zoom-out',
    duration: 9,
  },
  {
    id: 'scene-5',
    sceneNumber: 5,
    title: 'দায়িত্বের ভারী বোঝা',
    subtitle: 'উমর দৌড়ে গেলেন রাষ্ট্রীয় গুদামঘরে। নিজের কাঁধে তুললেন আটার বস্তা। সঙ্গী বলল... আমি বহন করি। উমর বললেন... কিয়ামতের দিন কি তুমি আমার বোঝা বহন করবে?',
    imageUrl: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1200&q=80',
    isCustomImage: false,
    motionPreset: 'pan-right',
    duration: 10,
  },
  {
    id: 'scene-6',
    sceneNumber: 6,
    title: 'দায়িত্বশীলতার অমর শিক্ষা',
    subtitle: 'এটা শুধু একটা গল্প না। এটা দায়িত্বের সংজ্ঞা। ক্ষমতা যার কাছে আছে... জবাবদিহিও তার কাছে সবচেয়ে বেশি। আল্লাহ আমাদের সেই দায়িত্ববোধ দান করুন। আমিন।',
    imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=1200&q=80',
    isCustomImage: false,
    motionPreset: 'tilt-down',
    duration: 10,
  },
];
