/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.API_KEY;

  // If no API_KEY is set in environment, allow requests (open access mode)
  if (!configuredKey || configuredKey.trim() === '') {
    return next();
  }

  // Extract API key from header or query param
  const headerKey = req.headers['x-api-key'] as string;
  const bearerKey = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.substring(7)
    : undefined;
  const queryKey = req.query.api_key as string;

  const providedKey = headerKey || bearerKey || queryKey;

  if (!providedKey || providedKey !== configuredKey) {
    logger.warn('Unauthorized API request attempt', {
      path: req.path,
      method: req.method,
    });

    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing API key. Provide a valid X-API-Key header or Bearer token.',
      },
    });
  }

  next();
}
