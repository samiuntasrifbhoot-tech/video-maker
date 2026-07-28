/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const windowMs = 60 * 1000; // 1 minute window
const maxRequestsPerWindow = parseInt(process.env.RATE_LIMIT_MAX || '60', 10); // 60 req/min default

const ipStore = new Map<string, RateLimitRecord>();

// Clean up stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    if (now > record.resetTime) {
      ipStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  // Skip rate limiting for static assets
  if (req.path.startsWith('/assets') || req.path === '/favicon.ico') {
    return next();
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
  const apiKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string);
  const identifier = apiKey ? `key:${apiKey}` : `ip:${clientIp}`;

  const now = Date.now();
  let record = ipStore.get(identifier);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
    ipStore.set(identifier, record);
  } else {
    record.count++;
  }

  const remaining = Math.max(0, maxRequestsPerWindow - record.count);
  const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', maxRequestsPerWindow);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

  if (record.count > maxRequestsPerWindow) {
    res.setHeader('Retry-After', retryAfterSeconds);
    logger.warn(`Rate limit exceeded for ${identifier}`, {
      path: req.path,
      method: req.method,
      metadata: { identifier, count: record.count },
    });

    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds,
      },
    });
  }

  next();
}
