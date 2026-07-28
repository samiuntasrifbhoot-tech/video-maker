/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jobStore, VideoJob, VideoJobPayload } from './jobStore';
import { renderVideoPipeline } from './videoRenderer';

export class VideoService {
  /**
   * Starts a video generation background task
   */
  startVideoGeneration(payload: VideoJobPayload): VideoJob {
    const job = jobStore.createJob(payload);

    // Process rendering in background asynchronously
    setImmediate(() => {
      this.processRenderJob(job.id, payload).catch((err) => {
        console.error(`[VideoService] Job ${job.id} failed:`, err);
        jobStore.updateJob(job.id, {
          status: 'failed',
          progress: 0,
          error: err?.message || 'Video rendering failed due to an internal server error',
        });
      });
    });

    return job;
  }

  /**
   * Background render pipeline processing using real canvas & ffmpeg rendering
   */
  private async processRenderJob(jobId: string, payload: VideoJobPayload): Promise<void> {
    jobStore.updateJob(jobId, { status: 'processing', progress: 5 });

    const renderResult = await renderVideoPipeline(jobId, payload, (progressPercent) => {
      jobStore.updateJob(jobId, { progress: Math.min(99, progressPercent) });
    });

    // Update job to completed with actual rendered video result
    jobStore.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      result: {
        videoUrl: renderResult.videoUrl,
        downloadUrl: renderResult.downloadUrl,
        thumbnailUrl: renderResult.thumbnailUrl,
        metadata: renderResult.metadata,
      },
    });
  }
}

export const videoService = new VideoService();
