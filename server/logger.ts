/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  info(message: string, context?: Partial<LogEntry>) {
    console.log(
      this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        ...context,
      })
    );
  }

  warn(message: string, context?: Partial<LogEntry>) {
    console.warn(
      this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        ...context,
      })
    );
  }

  error(message: string, errorObj?: any, context?: Partial<LogEntry>) {
    const errorDetails = errorObj
      ? {
          name: errorObj.name || 'Error',
          message: errorObj.message || String(errorObj),
          stack: errorObj.stack,
        }
      : undefined;

    console.error(
      this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        error: errorDetails,
        ...context,
      })
    );
  }

  debug(message: string, context?: Partial<LogEntry>) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      console.debug(
        this.formatLog({
          timestamp: new Date().toISOString(),
          level: 'debug',
          message,
          ...context,
        })
      );
    }
  }
}

export const logger = new Logger();
