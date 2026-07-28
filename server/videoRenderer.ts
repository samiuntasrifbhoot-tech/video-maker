/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createCanvas, loadImage, Image } from '@napi-rs/canvas';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { VideoJobPayload } from './jobStore';
import { GoogleGenAI } from '@google/genai';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface RenderResult {
  videoPath: string;
  thumbnailPath: string;
  videoUrl: string;
  downloadUrl: string;
  thumbnailUrl: string;
  metadata: {
    title: string;
    totalScenes: number;
    totalDurationSeconds: number;
    aspectRatio: string;
    resolution: string;
    format: string;
    hasVoiceover: boolean;
    hasMusic: boolean;
    fileSizeBytes: number;
    renderedAt: string;
    jobExecutionTimeMs: number;
  };
}

/**
 * Helper to split text into wrapped lines for canvas rendering
 */
function wrapText(
  ctx: any,
  text: string,
  maxWidth: number
): { text: string; width: number }[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: { text: string; width: number }[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine) {
      lines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
  }

  return lines;
}

/**
 * Adds WAV header to raw PCM buffer from Gemini TTS
 */
function addWavHeader(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Renders an AI Video Storyboard into a real MP4 video file and thumbnail image
 */
export async function renderVideoPipeline(
  jobId: string,
  payload: VideoJobPayload,
  onProgress?: (percent: number) => void
): Promise<RenderResult> {
  const startTime = Date.now();
  const tempDir = path.join(os.tmpdir(), `video_render_${jobId}`);
  const mediaDir = path.join(process.cwd(), 'media');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  const aspectRatio = payload.renderSettings?.aspectRatio || '9:16';
  const width = aspectRatio === '9:16' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : 720;
  const fps = 30;

  const scenes = payload.scenes && payload.scenes.length > 0
    ? payload.scenes
    : [
        {
          id: 'sc1',
          sceneNumber: 1,
          title: payload.title || 'AI Story Scene',
          subtitle: payload.script || 'AI Video Storyboard Generation',
          imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800',
          duration: payload.duration || 6,
          motionPreset: 'zoomIn',
        },
      ];

  const totalDurationSeconds = scenes.reduce((acc, s) => acc + (s.duration || 5), 0);
  const totalFrames = Math.ceil(totalDurationSeconds * fps);

  // 1. Preload Scene Images
  const loadedImages: (Image | null)[] = [];
  for (const sc of scenes) {
    if (sc.imageUrl && sc.imageUrl.startsWith('http')) {
      try {
        const img = await loadImage(sc.imageUrl);
        loadedImages.push(img);
      } catch (e) {
        console.warn(`[Renderer] Failed to load image from ${sc.imageUrl}:`, e);
        loadedImages.push(null);
      }
    } else {
      loadedImages.push(null);
    }
  }

  // 2. Synthesize Gemini TTS Voiceovers if enabled
  const voiceAudioPaths: { sceneIndex: number; audioPath: string }[] = [];
  if (payload.voiceSettings && process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      let sceneStartTimeAcc = 0;
      for (let i = 0; i < scenes.length; i++) {
        const sc = scenes[i];
        if (sc.subtitle && sc.subtitle.trim().length > 0) {
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-tts-preview',
              contents: [
                {
                  parts: [
                    {
                      text: `Please speak clearly with emotion and warmth: ${sc.subtitle}`,
                    },
                  ],
                },
              ],
              config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: payload.voiceSettings.voiceName || 'Kore',
                    },
                  },
                },
              },
            });

            const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (inlineData?.data) {
              const pcmBuffer = Buffer.from(inlineData.data, 'base64');
              const wavBuffer = addWavHeader(pcmBuffer, 24000);
              const wavPath = path.join(tempDir, `voice_scene_${i}.wav`);
              fs.writeFileSync(wavPath, wavBuffer);
              voiceAudioPaths.push({ sceneIndex: i, audioPath: wavPath });
            }
          } catch (e) {
            console.warn(`[Renderer] TTS generation warning for scene ${i}:`, e);
          }
        }
        sceneStartTimeAcc += sc.duration || 5;
      }
    } catch (e) {
      console.warn('[Renderer] Gemini TTS setup warning:', e);
    }
  }

  onProgress?.(20);

  // 3. Render Canvas Frames
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const framePaths: string[] = [];

  let currentFrameCount = 0;
  const totalSceneCount = scenes.length;

  for (let sIdx = 0; sIdx < totalSceneCount; sIdx++) {
    const scene = scenes[sIdx];
    const sceneDuration = scene.duration || 5;
    const sceneFrameCount = Math.ceil(sceneDuration * fps);
    const bgImg = loadedImages[sIdx];
    const motionPreset = scene.motionPreset || 'zoomIn';

    for (let f = 0; f < sceneFrameCount; f++) {
      const p = f / (sceneFrameCount - 1 || 1); // 0.0 to 1.0 scene progress

      // Clear Canvas
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Draw Background Image or Fallback Gradient
      ctx.save();
      if (bgImg) {
        let scale = 1.0;
        let translateX = 0;
        let translateY = 0;

        if (motionPreset === 'zoomIn') scale = 1.0 + p * 0.12;
        else if (motionPreset === 'zoomOut') scale = 1.12 - p * 0.12;
        else if (motionPreset === 'panRight') translateX = -width * 0.05 * (1 - p);
        else if (motionPreset === 'panLeft') translateX = width * 0.05 * (1 - p);
        else if (motionPreset === 'tiltUp') translateY = height * 0.05 * (1 - p);
        else if (motionPreset === 'tiltDown') translateY = -height * 0.05 * (1 - p);

        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = width / height;
        let drawW = width;
        let drawH = height;

        if (imgRatio > canvasRatio) {
          drawH = height;
          drawW = height * imgRatio;
        } else {
          drawW = width;
          drawH = width / imgRatio;
        }

        drawW *= scale;
        drawH *= scale;

        const drawX = (width - drawW) / 2 + translateX;
        const drawY = (height - drawH) / 2 + translateY;

        ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
      } else {
        // Aesthetic Dark Gradient Fallback
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();

      // Draw Vignette / Dark Overlays for Readability
      const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.35);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, height * 0.35);

      const bottomGrad = ctx.createLinearGradient(0, height * 0.55, 0, height);
      bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bottomGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(0, height * 0.55, width, height * 0.45);

      // Draw Top Scene Badge & Title
      ctx.save();
      const scaleFactor = height / 1280;

      // Badge: SCENE X / Y
      const badgeText = `SCENE ${sIdx + 1} / ${totalSceneCount}`;
      ctx.font = `bold ${Math.round(13 * scaleFactor)}px sans-serif`;
      const badgeWidth = ctx.measureText(badgeText).width + 24 * scaleFactor;
      const badgeX = (width - badgeWidth) / 2;
      const badgeY = 32 * scaleFactor;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, 26 * scaleFactor, 13 * scaleFactor);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, width / 2, badgeY + 13 * scaleFactor);

      // Title Text
      if (scene.title) {
        ctx.font = `bold ${Math.round(22 * scaleFactor)}px sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 8;
        ctx.fillText(scene.title, width / 2, badgeY + 54 * scaleFactor);
      }
      ctx.restore();

      // Draw Subtitle Box
      if (scene.subtitle) {
        ctx.save();
        const maxSubWidth = width - 64 * scaleFactor;
        ctx.font = `bold ${Math.round(20 * scaleFactor)}px sans-serif`;
        const lines = wrapText(ctx, scene.subtitle, maxSubWidth);

        const lineHeight = 30 * scaleFactor;
        const boxPaddingV = 16 * scaleFactor;
        const boxPaddingH = 24 * scaleFactor;
        const boxHeight = lines.length * lineHeight + boxPaddingV * 2;
        const maxLineWidth = Math.max(...lines.map((l) => l.width), 100);
        const boxWidth = Math.min(maxSubWidth, maxLineWidth + boxPaddingH * 2);
        const boxX = (width - boxWidth) / 2;
        const boxY = height - boxHeight - 80 * scaleFactor;

        // Dark box background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 12 * scaleFactor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 14 * scaleFactor);
        ctx.fill();

        // Subtitle Lines Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 4;

        lines.forEach((line, lIdx) => {
          const ly = boxY + boxPaddingV + lIdx * lineHeight;
          ctx.fillText(line.text, width / 2, ly);
        });

        ctx.restore();
      }

      // Draw Bottom Progress Line
      const globalProgress = (sIdx + p) / totalSceneCount;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(0, height - 8 * scaleFactor, width, 8 * scaleFactor);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, height - 8 * scaleFactor, width * globalProgress, 8 * scaleFactor);

      // Save Frame to disk
      const framePath = path.join(
        tempDir,
        `frame_${String(currentFrameCount).padStart(6, '0')}.png`
      );
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(framePath, buffer);
      framePaths.push(framePath);

      currentFrameCount++;
    }
  }

  onProgress?.(70);

  // Generate Thumbnail File (Frame 0)
  const thumbnailFilename = `thumb_${jobId}.jpg`;
  const thumbnailPath = path.join(mediaDir, thumbnailFilename);
  if (framePaths.length > 0) {
    const frame0Buf = fs.readFileSync(framePaths[0]);
    fs.writeFileSync(thumbnailPath, frame0Buf);
  }

  // 4. Compile Video with FFmpeg
  const outputFilename = `${jobId}.mp4`;
  const outputPath = path.join(mediaDir, outputFilename);

  await new Promise<void>((resolve, reject) => {
    let command = ffmpeg()
      .input(path.join(tempDir, 'frame_%06d.png'))
      .inputOptions(['-framerate 30']);

    // If TTS voices were synthesized, combine audio inputs
    if (voiceAudioPaths.length > 0) {
      for (const voiceObj of voiceAudioPaths) {
        command = command.input(voiceObj.audioPath);
      }
    }

    command
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset ultrafast',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        console.error('[Renderer] FFmpeg execution error:', err);
        reject(err);
      })
      .run();
  });

  onProgress?.(95);

  // Clean up temp directory frames async
  setTimeout(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('[Renderer] Cleanup warning:', e);
    }
  }, 1000);

  const fileStats = fs.statSync(outputPath);
  const executionTime = Date.now() - startTime;

  return {
    videoPath: outputPath,
    thumbnailPath,
    videoUrl: `/api/video/${outputFilename}`,
    downloadUrl: `/api/video/${outputFilename}?download=true`,
    thumbnailUrl: `/api/thumbnail/${thumbnailFilename}`,
    metadata: {
      title: payload.title || 'AI Generated Video Reel',
      totalScenes: scenes.length,
      totalDurationSeconds,
      aspectRatio,
      resolution: `${width}x${height}`,
      format: 'mp4',
      hasVoiceover: voiceAudioPaths.length > 0,
      hasMusic: Boolean(payload.music?.enableAmbientMusic),
      fileSizeBytes: fileStats.size,
      renderedAt: new Date().toISOString(),
      jobExecutionTimeMs: executionTime,
    },
  };
}
