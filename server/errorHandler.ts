/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}`;

  logger.error(`API Error on ${req.method} ${req.path}: ${message}`, err, {
    requestId,
    path: req.path,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    type: 'https://api.aistudio.build/errors/' + errorCode.toLowerCase(),
    title: errorCode,
    status: statusCode,
    detail: message,
    instance: req.path,
    requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
