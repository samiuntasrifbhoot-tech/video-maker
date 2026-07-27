/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { videoService } from './videoService';
import { jobStore } from './jobStore';
import { ISLAMIC_SCRIPT_LIBRARY } from '../src/data/islamicScripts';

export interface MCPToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MCP_TOOLS_CATALOG: MCPToolDeclaration[] = [
  {
    name: 'generate_video_storyboard',
    description:
      'Creates a new AI video storyboard render job with scenes, Bengali subtitles, keyframe motion presets, voiceover, and audio. Returns job details and status polling URL.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the video reel (e.g., "আসহাবে কাহাফের অলৌকিক ইতিহাস")',
        },
        script: {
          type: 'string',
          description: 'Full narrative Bengali story script text',
        },
        duration: {
          type: 'number',
          description: 'Total video duration target in seconds',
        },
        scenes: {
          type: 'array',
          description: 'Array of scenes with titles, subtitles, image URLs, and durations',
          items: {
            type: 'object',
            properties: {
              sceneNumber: { type: 'number' },
              title: { type: 'string' },
              subtitle: { type: 'string' },
              imageUrl: { type: 'string' },
              duration: { type: 'number' },
              motionPreset: { type: 'string' },
            },
          },
        },
        voiceSettings: {
          type: 'object',
          properties: {
            voiceName: { type: 'string', description: 'Voice speaker name (e.g., "Kore")' },
            voiceoverType: { type: 'string', description: 'Voiceover engine ("gemini")' },
          },
        },
        renderSettings: {
          type: 'object',
          properties: {
            aspectRatio: { type: 'string', description: 'Aspect ratio ("9:16", "16:9", "1:1")' },
            resolution: { type: 'string', description: 'Resolution ("1080p", "720p")' },
            format: { type: 'string', description: 'Video file format ("mp4", "webm")' },
          },
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_video_job_status',
    description:
      'Checks the current rendering status and final video result for a video generation job ID.',
    parameters: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'Unique Job ID returned by generate_video_storyboard',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'list_islamic_story_library',
    description:
      'Retrieves the library of ready-made Bengali Islamic story templates (Sahaba biographies, Quranic stories, Prophet narratives) with scenes and subtitles.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter category (e.g. "সাহাবীদের জীবনী", "পবিত্র কুরআনের কাহিনী")',
        },
      },
    },
  },
];

export async function executeMcpTool(name: string, args: any) {
  switch (name) {
    case 'generate_video_storyboard': {
      const job = videoService.startVideoGeneration(args);
      return {
        success: true,
        jobId: job.id,
        status: job.status,
        pollingUrl: `/api/job/${job.id}`,
        message: 'Video generation job created successfully.',
      };
    }

    case 'get_video_job_status': {
      const job = jobStore.getJob(args.jobId);
      if (!job) {
        return { success: false, error: `Job with ID '${args.jobId}' was not found.` };
      }
      return {
        success: true,
        job,
      };
    }

    case 'list_islamic_story_library': {
      let filtered = ISLAMIC_SCRIPT_LIBRARY;
      if (args?.category) {
        filtered = filtered.filter((s) => s.category === args.category);
      }
      return {
        success: true,
        totalScripts: filtered.length,
        scripts: filtered.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          description: s.description,
          totalDuration: s.totalDuration,
          sceneCount: s.scenes.length,
          scenesPreview: s.scenes.map((sc) => ({
            title: sc.title,
            subtitle: sc.subtitle,
            duration: sc.duration,
          })),
        })),
      };
    }

    default:
      throw new Error(`Unknown MCP tool name: '${name}'`);
  }
}
