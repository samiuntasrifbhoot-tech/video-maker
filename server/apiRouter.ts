/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { videoService } from './videoService';
import { jobStore } from './jobStore';
import { openApiSpec } from './openApiSpec';
import { MCP_TOOLS_CATALOG, executeMcpTool } from './mcpTools';
import { handleMcpJsonRpcRequest } from './mcpServer';
import { ISLAMIC_SCRIPT_LIBRARY } from '../src/data/islamicScripts';
import { GoogleGenAI } from '@google/genai';
import { logger } from './logger';
import { rateLimiter } from './rateLimiter';
import { authenticateApiKey } from './auth';

export const apiRouter = Router();

const startTime = Date.now();

// ---------------------------------------------------------------------------
// Middlewares: Global Request Logging & Rate Limiting
// ---------------------------------------------------------------------------
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  const reqStartTime = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - reqStartTime;
    logger.info(`HTTP ${req.method} ${req.path} ${res.statusCode} - ${durationMs}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
    });
  });
  next();
});

apiRouter.use(rateLimiter);

// Lazy initialization for Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// ---------------------------------------------------------------------------
// 1. Health Status Endpoint (Public)
// ---------------------------------------------------------------------------
apiRouter.get('/health', (req: Request, res: Response) => {
  const uptimeSeconds = (Date.now() - startTime) / 1000;
  const aiAvailable = Boolean(process.env.GEMINI_API_KEY);

  res.json({
    status: 'ok',
    service: 'AI Reels & Video Storyboard API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(uptimeSeconds * 10) / 10,
    activeFeatures: {
      videoGenerationApi: true,
      mcpToolIntegration: true,
      openApiDocumentation: true,
      geminiTtsVoiceover: aiAvailable,
      scriptLibrary: true,
      persistentStorage: true,
      rateLimiting: true,
      apiKeyAuth: Boolean(process.env.API_KEY),
    },
  });
});

// ---------------------------------------------------------------------------
// 2. Generate Video Job Endpoint (Protected)
// ---------------------------------------------------------------------------
apiRouter.post('/generate-video', authenticateApiKey, (req: Request, res: Response) => {
  try {
    const payload = req.body || {};

    // Validate request basics
    if (!payload.title && !payload.script && (!payload.scenes || payload.scenes.length === 0)) {
      return res.status(400).json({
        error: 'Invalid request payload. Please provide at least a title, script, or scenes array.',
      });
    }

    const job = videoService.startVideoGeneration(payload);

    res.status(202).json({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      estimatedDurationSeconds: Math.max(3, (payload.scenes?.length || 3) * 1.5),
      pollingUrl: `/api/job/${job.id}`,
      message: 'Video generation job created successfully and queued for background rendering.',
    });
  } catch (err: any) {
    logger.error('[API] /generate-video error:', err);
    res.status(500).json({
      error: err?.message || 'Failed to enqueue video generation job.',
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Get Job Status Endpoint (Public for Polling)
// ---------------------------------------------------------------------------
apiRouter.get('/job/:id', (req: Request, res: Response) => {
  const jobId = req.params.id;
  const job = jobStore.getJob(jobId);

  if (!job) {
    return res.status(404).json({
      error: `Video generation job with ID '${jobId}' was not found.`,
    });
  }

  res.json(job);
});

// ---------------------------------------------------------------------------
// 4. List All Jobs Endpoint (Public)
// ---------------------------------------------------------------------------
apiRouter.get('/jobs', (req: Request, res: Response) => {
  const jobs = jobStore.getAllJobs();
  res.json({
    totalJobs: jobs.length,
    jobs,
  });
});

// ---------------------------------------------------------------------------
// 5. Video Media Download/Stream Asset Endpoint (Public)
// ---------------------------------------------------------------------------
apiRouter.get('/video/:id', (req: Request, res: Response) => {
  const rawId = req.params.id;
  const jobId = rawId.replace(/\.(mp4|webm)$/i, '');
  const isDownload = req.query.download === 'true';

  const job = jobStore.getJob(jobId);
  const mediaDir = path.join(process.cwd(), 'media');
  const filePath = path.join(mediaDir, `${jobId}.mp4`);

  const downloadFilename = `${job?.payload?.title || 'video_reel'}_${jobId}.mp4`.replace(/\s+/g, '_');

  if (fs.existsSync(filePath)) {
    if (isDownload) {
      return res.download(filePath, downloadFilename);
    }
    return res.sendFile(filePath);
  }

  res.status(404).json({ error: `Video asset for job '${jobId}' was not found or is still rendering.` });
});

// ---------------------------------------------------------------------------
// 5b. Thumbnail Asset Endpoint (Public)
// ---------------------------------------------------------------------------
apiRouter.get('/thumbnail/:id', (req: Request, res: Response) => {
  const rawId = req.params.id;
  const mediaDir = path.join(process.cwd(), 'media');
  const filePath = path.join(mediaDir, rawId);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  res.status(404).json({ error: `Thumbnail '${rawId}' not found.` });
});

// ---------------------------------------------------------------------------
// 6. OpenAPI Specifications JSON (Public)
// ---------------------------------------------------------------------------
apiRouter.get('/openapi.json', (req: Request, res: Response) => {
  res.json(openApiSpec);
});

// ---------------------------------------------------------------------------
// 7. Interactive API Documentation Page (Public)
// ---------------------------------------------------------------------------
apiRouter.get('/docs', (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Video Generator - OpenAPI Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background-color: #0f172a; color: #f8fafc; font-family: sans-serif; }
    .top-banner { background: #020617; border-bottom: 1px solid #1e293b; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
    .top-banner h1 { margin: 0; font-size: 18px; color: #f59e0b; font-weight: bold; }
    .top-banner p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
    .badge { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
    #swagger-ui { background: #fff; border-radius: 12px; margin: 20px; overflow: hidden; }
  </style>
</head>
<body>
  <div class="top-banner">
    <div>
      <h1>🎬 AI Video Generator REST API & MCP Tool Docs</h1>
      <p>Interactive Swagger & AI Tool Integration Documentation for ChatGPT, Claude, Gemini, Kimi, and Custom Agents</p>
    </div>
    <span class="badge">OpenAPI 3.0 Ready</span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>`;
  res.send(html);
});

// ---------------------------------------------------------------------------
// 8. Model Context Protocol (MCP) Protocol Endpoint & REST Tools Catalog
// ---------------------------------------------------------------------------
apiRouter.get('/mcp/tools', (req: Request, res: Response) => {
  res.json({
    tools: MCP_TOOLS_CATALOG,
  });
});

// JSON-RPC MCP Standard Protocol Endpoint
apiRouter.post('/mcp', (req: Request, res: Response) => {
  handleMcpJsonRpcRequest(req, res);
});

// ---------------------------------------------------------------------------
// 9. Execute Model Context Protocol (MCP) Tool (Protected)
// ---------------------------------------------------------------------------
apiRouter.post('/mcp/call', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const { name, arguments: args, params } = req.body || {};
    const toolName = name || req.body?.method;
    const toolArgs = args || params || {};

    if (!toolName) {
      return res.status(400).json({ error: 'Tool name is required in request body.' });
    }

    const result = await executeMcpTool(toolName, toolArgs);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'MCP Tool execution failed.' });
  }
});

// ---------------------------------------------------------------------------
// 10. List Predefined Script Library (Public)
// ---------------------------------------------------------------------------
apiRouter.get('/scripts', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  let list = ISLAMIC_SCRIPT_LIBRARY;
  if (category) {
    list = list.filter((s) => s.category === category);
  }
  res.json({
    totalScripts: list.length,
    scripts: list,
  });
});

// ---------------------------------------------------------------------------
// 11. Text-To-Speech API (Gemini TTS) (Protected)
// ---------------------------------------------------------------------------
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

apiRouter.post('/tts', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'ভয়েস জেনারেট করার জন্য কোনো টেক্সট দেওয়া হয়নি।' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error:
          'Gemini API কী পাওয়া যায়নি। অনুগ্রহ করে Settings > Secrets প্যানেল থেকে GEMINI_API_KEY সেট করুন।',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          parts: [
            {
              text: `Please speak the following text out loud clearly with strong emotion, warmth, and vocal tone: ${text}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      return res.status(500).json({ error: 'মডেল থেকে কোনো ভয়েস ডেটা পাওয়া যায়নি।' });
    }

    const pcmBuffer = Buffer.from(inlineData.data, 'base64');
    let sampleRate = 24000;
    const rateMatch = (inlineData.mimeType || '').match(/rate=(\d+)/i);
    if (rateMatch) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    const isWavHeader =
      pcmBuffer.length >= 12 && pcmBuffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const finalBuffer = isWavHeader ? pcmBuffer : addWavHeader(pcmBuffer, sampleRate);

    res.json({
      base64Audio: finalBuffer.toString('base64'),
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    const errMsg = `${err?.message || err}`;
    const isQuota =
      err?.status === 429 ||
      err?.code === 429 ||
      errMsg.includes('429') ||
      errMsg.includes('RESOURCE_EXHAUSTED');
    res.status(500).json({
      error: isQuota
        ? 'Gemini AI ভয়েস কোটা অতিক্রান্ত হয়েছে। ব্রাউজার ভয়েসে রিডাইরেক্ট করা হচ্ছে।'
        : 'ভয়েস জেনারেট করতে সমস্যা হয়েছে।',
      isBusy: isQuota,
    });
  }
});

// ---------------------------------------------------------------------------
// 12. AI Assistant Chat & Auto Reel Generation Endpoint
// ---------------------------------------------------------------------------
apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'বার্তা বা নির্দেশ খালি হতে পারবে না।' });
    }

    const ai = getGeminiClient();

    // Helper fallback for predefined stories when AI client isn't available or fails
    const createFallbackReelPayload = (userText: string) => {
      const lower = userText.toLowerCase();
      let title = 'ইসলামিক ঐতিহাসিক শিক্ষণীয় কাহিনী';
      let script = 'বহু বছর পূর্বে ঈমানদারদের একটি দল সত্যের পথে অটল থাকার উদ্দেশ্যে একটি অলৌকিক গুহায় আশ্রয় গ্রহণ করেছিলেন। আল্লাহ তাআলা তাদেরকে দীর্ঘ বছর ধরে সুপ্ত অবস্থায় রক্ষা করেন।';
      let scenes = [
        {
          sceneNumber: 1,
          title: 'সত্যের পথে ঈমানদার যুবকদল',
          subtitle: 'সত্য ও তাওহীদের ওপর অবিচল থাকার জন্য একদল যুবক সব রাজকীয় বিলাসিতা ত্যাগ করেন।',
          imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000',
          imagePrompt: 'Ancient desert landscape under golden twilight sky with brave faithful youth journeying',
          duration: 6,
          motionPreset: 'ken-burns-in'
        },
        {
          sceneNumber: 2,
          title: 'অলৌকিক পর্বতের গুহা',
          subtitle: 'নিরাপত্তার উদ্দেশ্যে তারা একটি নির্জন পর্বতের গুহায় আশ্রয় নেন এবং মহান আল্লাহর কাছে সাহায্য চান।',
          imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000',
          imagePrompt: 'Atmospheric cave entrance on high rocky mountain cliffs with glowing sunlight beam',
          duration: 7,
          motionPreset: 'zoom-out'
        },
        {
          sceneNumber: 3,
          title: 'দীর্ঘ ৩৯ বছর সুপ্ত অবস্থা',
          subtitle: 'আল্লাহ তাআলা তাদেরকে গুহার ভেতরে দীর্ঘ তিনশত নয় বছর ধরে এক অলৌকিক ঘুমে সংরক্ষণ করেন।',
          imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000',
          imagePrompt: 'Mystical starry night sky over peaceful ancient mountains with quiet moonlight',
          duration: 7,
          motionPreset: 'subtle-float'
        },
        {
          sceneNumber: 4,
          title: 'ঈমানের মহা বিজয় ও শিক্ষা',
          subtitle: 'দীর্ঘ সময় পর তারা জাগ্রত হন—যা কিয়ামত পর্যন্ত মুমিনদের জন্য ঈমানের এক উজ্জ্বল নিদর্শন।',
          imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1000',
          imagePrompt: 'Majestic ancient Islamic heritage architecture with radiant sunrise beams',
          duration: 8,
          motionPreset: 'pan-right'
        }
      ];

      if (lower.includes('আবু বকর') || lower.includes('abu bakr') || lower.includes('দান')) {
        title = 'হযরত আবু বকর (রা:) এর অতুলনীয় ত্যাগ';
        script = 'তাবুক যুদ্ধের সময় রাসূল (সা:) যখন অর্থ সাহায্য চাইলেন, হযরত আবু বকর (রা:) নিজের ঘরের সমস্ত সম্পদ নিয়ে উপস্থিত হলেন।';
        scenes = [
          {
            sceneNumber: 1,
            title: 'তাবুক যুদ্ধের আহ্বান',
            subtitle: 'মদীনার কঠিন পরিস্থিতিতে বিশ্বনবী (সা:) সকল সাহাবীদের ত্যাগ স্বীকারের আহ্বান জানালেন।',
            imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000',
            imagePrompt: 'Ancient oasis city in Medina with palm trees and warm desert golden light',
            duration: 6,
            motionPreset: 'ken-burns-in'
          },
          {
            sceneNumber: 2,
            title: 'ঘরের সমস্ত সম্পদ উৎসর্গ',
            subtitle: 'হযরত আবু বকর (রা:) ঘরের শেষ সুতোটি পর্যন্ত বিশ্বনবীর চরণে এনে সমর্পণ করলেন।',
            imageUrl: 'https://images.unsplash.com/photo-1609599006353-e629aa5d9018?q=80&w=1000',
            imagePrompt: 'Ancient manuscript and simple humble traditional home setting with warm ambient light',
            duration: 7,
            motionPreset: 'pan-left'
          },
          {
            sceneNumber: 3,
            title: 'আল্লাহ ও তাঁর রাসূলের ভালোবাসার পরাকাষ্ঠা',
            subtitle: 'রাসূল (সা:) জিজ্ঞেস করলেন "পরিবারের জন্য কী রেখে এলে?" উত্তরে বললেন: "আল্লাহ ও তাঁর রাসূলের নাম!"',
            imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1000',
            imagePrompt: 'Serene Islamic heritage setting with warm heavenly light glowing on archways',
            duration: 8,
            motionPreset: 'subtle-float'
          }
        ];
      }

      return {
        title,
        script,
        duration: 30,
        scenes,
        voiceSettings: { voiceName: 'Kore', voiceoverType: 'gemini' as const },
        renderSettings: { aspectRatio: '9:16' as const, resolution: '1080p' as const, format: 'mp4' as const }
      };
    };

    if (!ai) {
      // Fallback if no Gemini key available
      const payload = createFallbackReelPayload(message);
      const job = videoService.startVideoGeneration(payload);
      return res.json({
        replyText: `আমি আপনার জন্য "${payload.title}" শীর্ষক ৩০ সেকেন্ডের একটি চমৎকার রিল এবং স্টোরিবোর্ড তৈরি করা শুরু করেছি! নিচে রেন্ডারিং অগ্রগতির লাইভ স্টেটাস দেখতে পাবেন।`,
        shouldGenerateVideo: true,
        jobId: job.id,
        pollingUrl: `/api/job/${job.id}`,
        jobStatus: job,
        videoPayload: payload
      });
    }

    // Call Gemini to decide intent and generate full script and scenes
    const systemPrompt = `You are an AI Video Reel & Storyboard Producer for Islamic short reels and TikTok videos.
Respond in clear, polite Bengali.
Analyze the user's input.
Determine if the user wants to generate or make a video/reel/short/storyboard (e.g. "Create a 30-second reel about Ashab-e-Kahf", "আসহাবে কাহাফের ভিডিও বানাও", "Make a reel on Abu Bakr", "Create a story about Yusuf", etc.).

Return a JSON object matching this schema strictly:
{
  "replyText": "Polite explanation in Bengali describing what was created or answering the question.",
  "shouldGenerateVideo": true or false,
  "videoPayload": {
    "title": "Title in Bengali",
    "script": "Full narration story script in Bengali",
    "duration": 30,
    "scenes": [
      {
        "sceneNumber": 1,
        "title": "Scene title in Bengali",
        "subtitle": "Clear, moving narration text in Bengali for this scene (max 20 words)",
        "duration": 6,
        "motionPreset": "ken-burns-in",
        "imagePrompt": "Cinematic 8k photorealistic image description in English suitable for Unsplash/AI generation",
        "imageUrl": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000"
      }
    ]
  }
}

Use high quality cinematic Unsplash image URLs if appropriate (e.g., cave, desert, ancient city, night sky, manuscripts, mountains).
If the user's input is a general query or request for text, set shouldGenerateVideo: false and videoPayload: null.`;

    const promptText = `User message: "${message}"\n\nPlease generate appropriate response and structured reel payload if requested.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      }
    });

    const rawJson = response.text ? response.text.trim() : '';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawJson);
    } catch {
      parsedData = {
        replyText: response.text || 'আপনার বার্তার উত্তর তৈরি করা হয়েছে।',
        shouldGenerateVideo: false
      };
    }

    if (parsedData.shouldGenerateVideo && parsedData.videoPayload) {
      // Ensure required properties
      if (!parsedData.videoPayload.title) parsedData.videoPayload.title = 'ইসলামিক শিক্ষণীয় কাহিনী';
      if (!parsedData.videoPayload.scenes || parsedData.videoPayload.scenes.length === 0) {
        const fallback = createFallbackReelPayload(message);
        parsedData.videoPayload.scenes = fallback.scenes;
      }

      // Start actual video rendering pipeline on the server
      const job = videoService.startVideoGeneration(parsedData.videoPayload);

      return res.json({
        replyText: parsedData.replyText || `আপনার অনুরোধ অনুযায়ী "${parsedData.videoPayload.title}" ভিডিও রিল তৈরির প্রক্রিয়া শুরু হয়েছে।`,
        shouldGenerateVideo: true,
        jobId: job.id,
        pollingUrl: `/api/job/${job.id}`,
        jobStatus: job,
        videoPayload: parsedData.videoPayload
      });
    }

    return res.json({
      replyText: parsedData.replyText || 'ধন্যবাদ! আমি আপনার ইসলামিক স্টোরিবোর্ড এবং ভিডিও তৈরিতে সহায়তা করতে প্রস্তুত।',
      shouldGenerateVideo: false
    });

  } catch (err: any) {
    logger.error('[API] /ai/chat error:', err);
    // Graceful fallback to video generation if Gemini API error occurs
    try {
      const fallbackPayload = {
        title: 'আসহাবে কাহাফের অলৌকিক ইতিহাস',
        script: 'সত্যের পথে ঈমানদার যুবকদলের অলৌকিক গুহায় আশ্রয় ও দীর্ঘ ৩৯ বছরের সুপ্ত অবস্থার ইতিহাস।',
        duration: 30,
        scenes: [
          {
            sceneNumber: 1,
            title: 'ঈমানদার যুবকদল',
            subtitle: 'সত্যের ওপর অবিচল থাকার জন্য যুবকদল রাজকীয় পরিবার ত্যাগ করে এক আল্লাহর পথ বেছে নেন।',
            imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000',
            duration: 7,
            motionPreset: 'ken-burns-in'
          },
          {
            sceneNumber: 2,
            title: 'অলৌকিক গুহা',
            subtitle: 'নিরাপত্তার জন্য তারা নির্জন পর্বতের অলৌকিক গুহায় আশ্রয় গ্রহণ করেন।',
            imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000',
            duration: 7,
            motionPreset: 'zoom-out'
          },
          {
            sceneNumber: 3,
            title: 'দীর্ঘ ৩৯ বছর সুপ্ত অবস্থায় সংরক্ষণ',
            subtitle: 'মহান আল্লাহ তাআলা তাদেরকে গুহার ভেতরে দীর্ঘ তিনশত নয় বছর সুপ্ত রেখে রক্ষা করেন।',
            imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000',
            duration: 8,
            motionPreset: 'subtle-float'
          },
          {
            sceneNumber: 4,
            title: 'ঈমানের বিজয়',
            subtitle: 'দীর্ঘ সময় পর তারা আবার জাগ্রত হন—যা কিয়ামত পর্যন্ত ঈমানদারদের মহা নিদর্শন।',
            imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1000',
            duration: 8,
            motionPreset: 'pan-right'
          }
        ],
        voiceSettings: { voiceName: 'Kore', voiceoverType: 'gemini' as const },
        renderSettings: { aspectRatio: '9:16' as const, resolution: '1080p' as const, format: 'mp4' as const }
      };

      const job = videoService.startVideoGeneration(fallbackPayload);

      res.json({
        replyText: `আমি আপনার জন্য "${fallbackPayload.title}" ভিডিও রিলটি জেনারেট করে দিয়েছি। নিচে রেন্ডারিং অগ্রগতির লাইভ আপডেট দেখতে পাবেন।`,
        shouldGenerateVideo: true,
        jobId: job.id,
        pollingUrl: `/api/job/${job.id}`,
        jobStatus: job,
        videoPayload: fallbackPayload
      });
    } catch (renderErr: any) {
      res.status(500).json({ error: 'AI উত্তর ও ভিডিও রেন্ডারিং করতে সমস্যা হয়েছে।' });
    }
  }
});

// Catch-all route for any unhandled /api/* paths to ensure JSON 404s are returned instead of SPA index.html
apiRouter.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API route '${req.originalUrl || req.path}' was not found.`,
  });
});

