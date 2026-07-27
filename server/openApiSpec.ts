/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "AI Reels & Video Storyboard Generator API",
    description:
      "Production-ready REST API and AI Tool Integration layer for generating reels, shorts, and video storyboards with voiceovers, audio synthesis, and visual transitions. Designed for seamless integration with ChatGPT, Claude, Gemini, Kimi, and Model Context Protocol (MCP) clients.",
    version: "1.0.0",
    contact: {
      name: "AI Studio Build Team",
      url: "https://ai.studio/build",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current Application Host Server",
    },
  ],
  tags: [
    {
      name: "Video Generation",
      description: "Asynchronous AI Video and Storyboard Generation Endpoints",
    },
    {
      name: "Audio & Speech",
      description: "Text-To-Speech (TTS) Voiceover Services",
    },
    {
      name: "System & Health",
      description: "System Health Checks and Diagnostics",
    },
    {
      name: "MCP & AI Tools",
      description: "Model Context Protocol (MCP) and Assistant Tool Declarations",
    },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["System & Health"],
        summary: "Check API Health Status",
        description: "Returns current server health, system status, uptime, and active capability flags.",
        operationId: "getHealthStatus",
        responses: {
          "200": {
            description: "Server is healthy and ready",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/generate-video": {
      post: {
        tags: ["Video Generation"],
        summary: "Submit AI Video Generation Request",
        description:
          "Enqueues a video generation task with scripts, scene keyframes, motion presets, voice settings, and background audio. Returns a Job ID immediately for async status polling.",
        operationId: "generateVideo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/GenerateVideoRequest",
              },
              example: {
                title: "আসহাবে কাহাফের অলৌকিক ঘটনা",
                script: "আসহাবে কাহাফ বা গুহার অধিবাসীদের ঐতিহাসিক ঈমানদীপ্ত কাহিনীর সারসংক্ষেপ...",
                duration: 25,
                scenes: [
                  {
                    sceneNumber: 1,
                    title: "প্রাচীন শহরের অত্যাচারী শাসক",
                    subtitle: "বহু বছর আগে এক ঈমানদার যুবকদের দল তাদের বিশ্বাস রক্ষার জন্য শহরে লড়াই করেন...",
                    imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800",
                    duration: 6,
                    motionPreset: "zoomIn"
                  }
                ],
                voiceSettings: {
                  voiceName: "Kore",
                  voiceoverType: "gemini",
                  voiceoverRate: 1.0,
                  voiceoverPitch: 1.0
                },
                music: {
                  enableAmbientMusic: true,
                  musicVolume: 0.3
                },
                renderSettings: {
                  aspectRatio: "9:16",
                  resolution: "1080p",
                  format: "mp4"
                }
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Job successfully enqueued",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/JobEnqueuedResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid request body format",
          },
        },
      },
    },
    "/api/job/{id}": {
      get: {
        tags: ["Video Generation"],
        summary: "Get Video Generation Job Status and Results",
        description:
          "Poll job status using the returned Job ID. When status is 'completed', returns final video URL, download link, thumbnail, and video metadata.",
        operationId: "getJobStatus",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique video generation Job ID (e.g. job_1722000000_abc123)",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Current job details and results",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/VideoJobStatus",
                },
              },
            },
          },
          "404": {
            description: "Job ID not found",
          },
        },
      },
    },
    "/api/jobs": {
      get: {
        tags: ["Video Generation"],
        summary: "List All Video Generation Jobs",
        description: "Returns a list of recent video generation jobs processed by the application.",
        operationId: "listJobs",
        responses: {
          "200": {
            description: "List of jobs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalJobs: { type: "integer" },
                    jobs: {
                      type: "array",
                      items: { $ref: "#/components/schemas/VideoJobStatus" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/video/{id}": {
      get: {
        tags: ["Video Generation"],
        summary: "Retrieve or Download Rendered Video Asset",
        description: "Serves or redirects to the generated video file.",
        operationId: "getVideoAsset",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Job ID or video identifier (e.g., job_12345.mp4)",
            schema: {
              type: "string",
            },
          },
          {
            name: "download",
            in: "query",
            required: false,
            description: "Set to 'true' to trigger direct file attachment download",
            schema: {
              type: "boolean",
            },
          },
        ],
        responses: {
          "200": {
            description: "Video stream or download binary payload",
          },
          "404": {
            description: "Video asset not found",
          },
        },
      },
    },
    "/api/tts": {
      post: {
        tags: ["Audio & Speech"],
        summary: "Generate Voiceover Audio with Gemini TTS",
        description: "Synthesizes spoken text into high-quality WAV speech audio with custom voice tone.",
        operationId: "generateTTS",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", description: "Text content to speak" },
                  voice: { type: "string", example: "Kore", description: "Gemini prebuilt voice name" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Audio base64 payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    base64Audio: { type: "string" },
                    mimeType: { type: "string", example: "audio/wav" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/scripts": {
      get: {
        tags: ["Video Generation"],
        summary: "List Ready-Made Islamic & Educational Storyboard Scripts",
        description: "Returns predefined Bengali Islamic scripts and scene templates for instant storyboarding.",
        operationId: "listScriptLibrary",
        responses: {
          "200": {
            description: "Script library listing",
          },
        },
      },
    },
    "/api/mcp/tools": {
      get: {
        tags: ["MCP & AI Tools"],
        summary: "List Model Context Protocol (MCP) Tools",
        description: "Returns MCP tool declarations for ChatGPT, Claude, Gemini, Kimi, and AI agents.",
        operationId: "getMcpTools",
        responses: {
          "200": {
            description: "MCP tools catalog",
          },
        },
      },
    },
    "/api/mcp/call": {
      post: {
        tags: ["MCP & AI Tools"],
        summary: "Execute Model Context Protocol (MCP) Tool Call",
        description: "Standard endpoint for executing AI assistant tool calls programmatically.",
        operationId: "callMcpTool",
        responses: {
          "200": {
            description: "Tool execution result",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          service: { type: "string", example: "ai-video-generator-api" },
          timestamp: { type: "string", example: "2026-07-27T05:00:00.000Z" },
          uptimeSeconds: { type: "number", example: 124.5 },
          aiGeminiConnected: { type: "boolean", example: true },
          mcpReady: { type: "boolean", example: true },
        },
      },
      GenerateVideoRequest: {
        type: "object",
        properties: {
          title: { type: "string", description: "Video project title" },
          script: { type: "string", description: "Full narrational story script" },
          duration: { type: "number", description: "Total requested video duration in seconds" },
          scenes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sceneNumber: { type: "integer" },
                title: { type: "string" },
                subtitle: { type: "string" },
                imageUrl: { type: "string" },
                imagePrompt: { type: "string" },
                duration: { type: "number" },
                motionPreset: { type: "string" },
              },
            },
          },
          imagePrompts: {
            type: "array",
            items: { type: "string" },
          },
          voiceSettings: {
            type: "object",
            properties: {
              voiceName: { type: "string", example: "Kore" },
              voiceoverType: { type: "string", example: "gemini" },
              voiceoverRate: { type: "number", example: 1.0 },
              voiceoverPitch: { type: "number", example: 1.0 },
            },
          },
          music: {
            type: "object",
            properties: {
              bgMusicUrl: { type: "string" },
              enableAmbientMusic: { type: "boolean" },
              musicVolume: { type: "number" },
            },
          },
          renderSettings: {
            type: "object",
            properties: {
              aspectRatio: { type: "string", example: "9:16" },
              resolution: { type: "string", example: "1080p" },
              frameRate: { type: "number", example: 30 },
              format: { type: "string", example: "mp4" },
            },
          },
        },
      },
      JobEnqueuedResponse: {
        type: "object",
        properties: {
          jobId: { type: "string", example: "job_1753580000_a1b2c3d4" },
          status: { type: "string", example: "queued" },
          createdAt: { type: "string", example: "2026-07-27T05:00:00.000Z" },
          estimatedDurationSeconds: { type: "number", example: 4.5 },
          pollingUrl: { type: "string", example: "/api/job/job_1753580000_a1b2c3d4" },
          message: { type: "string", example: "Video generation job created successfully." },
        },
      },
      VideoJobStatus: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: ["queued", "processing", "completed", "failed"] },
          progress: { type: "integer", example: 100 },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
          payload: { $ref: "#/components/schemas/GenerateVideoRequest" },
          result: {
            type: "object",
            properties: {
              videoUrl: { type: "string" },
              downloadUrl: { type: "string" },
              thumbnailUrl: { type: "string" },
              metadata: { type: "object" },
            },
          },
          error: { type: "string" },
        },
      },
    },
  },
};
