/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export interface VideoJobPayload {
  title?: string;
  script?: string;
  scenes?: Array<{
    id?: string;
    sceneNumber?: number;
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    imagePrompt?: string;
    duration?: number;
    motionPreset?: string;
    audioUrl?: string;
  }>;
  imagePrompts?: string[] | string;
  voiceSettings?: {
    voiceName?: string;
    voiceoverType?: 'gemini' | 'custom-full';
    voiceoverRate?: number;
    voiceoverPitch?: number;
  };
  duration?: number;
  music?: {
    bgMusicUrl?: string;
    enableAmbientMusic?: boolean;
    musicVolume?: number;
  };
  renderSettings?: {
    aspectRatio?: '9:16' | '16:9' | '1:1';
    resolution?: '1080p' | '720p' | '4k';
    frameRate?: number;
    format?: 'mp4' | 'webm';
  };
}

export interface VideoJobResult {
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
    fileSizeBytes?: number;
    renderedAt: string;
    jobExecutionTimeMs: number;
  };
}

export interface VideoJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 - 100
  createdAt: string;
  updatedAt: string;
  payload: VideoJobPayload;
  result?: VideoJobResult;
  error?: string;
}

class PersistentJobStore {
  private jobs: Map<string, VideoJob> = new Map();
  private dbDir: string;
  private dbFilePath: string;

  constructor() {
    this.dbDir = path.join(process.cwd(), 'data');
    this.dbFilePath = path.join(this.dbDir, 'jobs_db.json');

    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }

    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const rawData = fs.readFileSync(this.dbFilePath, 'utf-8');
        if (rawData.trim()) {
          const parsed: VideoJob[] = JSON.parse(rawData);
          this.jobs.clear();
          for (const job of parsed) {
            this.jobs.set(job.id, job);
          }
          logger.info(`Loaded ${this.jobs.size} jobs from persistent database`, {
            path: this.dbFilePath,
          });
        }
      }
    } catch (e: any) {
      logger.error('Failed to load persistent job store from disk', e);
    }
  }

  private saveToDisk() {
    try {
      const allJobs = this.getAllJobs();
      const tmpPath = `${this.dbFilePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(allJobs, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.dbFilePath);
    } catch (e: any) {
      logger.error('Failed to save persistent job store to disk', e);
    }
  }

  createJob(payload: VideoJobPayload): VideoJob {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const id = `job_${Date.now()}_${randomSuffix}`;
    const now = new Date().toISOString();

    const job: VideoJob = {
      id,
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
      payload,
    };

    this.jobs.set(id, job);
    this.cleanOldJobs();
    this.saveToDisk();
    return job;
  }

  getJob(id: string): VideoJob | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): VideoJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  updateJob(
    id: string,
    updates: Partial<Omit<VideoJob, 'id' | 'createdAt'>>
  ): VideoJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob: VideoJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.jobs.set(id, updatedJob);
    this.saveToDisk();
    return updatedJob;
  }

  private cleanOldJobs() {
    // Keep max 200 recent jobs in persistent database
    if (this.jobs.size > 200) {
      const sorted = this.getAllJobs();
      const toDelete = sorted.slice(200);
      for (const oldJob of toDelete) {
        this.jobs.delete(oldJob.id);
      }
    }
  }
}

export const jobStore = new PersistentJobStore();
