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
