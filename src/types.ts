/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MotionPreset =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tilt-down'
  | 'static';

export type TransitionStyle = 'crossfade' | 'slide-left' | 'dip-to-black' | 'zoom-fade';

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  isCustomImage: boolean;
  motionPreset: MotionPreset;
  duration: number; // in seconds
  voiceoverAudioUrl?: string;
  voiceoverAudioName?: string;
  imagePrompt?: string;
}

export interface VideoSettings {
  aspectRatio: '9:16' | '16:9';
  transitionStyle: TransitionStyle;
  subtitleFontSize: number; // in px
  subtitleColor: string;
  subtitleBgOpacity: number; // 0 to 1
  subtitlePosition: 'bottom' | 'middle' | 'top';
  subtitleFontFamily: string;
  subtitleAnimation: 'word-by-word' | 'fade-in' | 'typewriter' | 'none';
  enableAmbientMusic: boolean;
  musicVolume: number; // 0 to 1
  enableVoiceover: boolean;
  voiceoverType: 'gemini' | 'custom-full';
  voiceoverVoice: string; // prebuilt voice name
  voiceoverRate: number; // 0.5 to 2
  voiceoverPitch: number; // 0.5 to 2
  voiceoverLang: string;
  fullVoiceoverUrl?: string;
  fullVoiceoverName?: string;
  fullVoiceoverDuration?: number;
}
