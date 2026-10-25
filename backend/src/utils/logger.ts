// ============================================================
// AccessRoute AI — Structured Logger
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`;
  if (entry.data && Object.keys(entry.data).length > 0) {
    // Redact sensitive fields
    const safeData = { ...entry.data };
    for (const key of Object.keys(safeData)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('key') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('password') ||
        lowerKey.includes('credential') ||
        lowerKey.includes('authorization')
      ) {
        safeData[key] = '[REDACTED]';
      }
    }
    return `${base} ${JSON.stringify(safeData)}`;
  }
  return base;
}

function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    data,
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export function createLogger(module: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => log('debug', module, message, data),
    info: (message: string, data?: Record<string, unknown>) => log('info', module, message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', module, message, data),
    error: (message: string, data?: Record<string, unknown>) => log('error', module, message, data),
  };
}
