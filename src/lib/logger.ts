
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
}

/**
 * A simple logger utility for standardizing application logs.
 * This can be used on both the server and the client.
 *
 * In a production environment, this could be expanded to send logs
 * to a dedicated logging service (e.g., Datadog, Logtail).
 *
 * @param level - The severity level of the log (INFO, WARN, ERROR, DEBUG).
 * @param message - The main log message.
 * @param details - An optional object for additional structured data.
 */
function log(level: LogLevel, message: string, details?: Record<string, any>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  };

  // In a server environment or during development, log structured JSON to the console.
  // This makes logs easier to parse and query.
  if (typeof window === 'undefined') {
    // Server-side logging
    console.log(JSON.stringify(entry));
  } else {
    // Client-side logging - use console methods that match level
    const logDetails = details ? `\n${JSON.stringify(details, null, 2)}` : '';
    switch (level) {
      case 'INFO':
        console.info(`[INFO] ${message}`, logDetails);
        break;
      case 'WARN':
        console.warn(`[WARN] ${message}`, logDetails);
        break;
      case 'ERROR':
        console.error(`[ERROR] ${message}`, logDetails);
        break;
      case 'DEBUG':
        console.debug(`[DEBUG] ${message}`, logDetails);
        break;
    }
  }
}

export const logger = {
  info: (message: string, details?: Record<string, any>) => log('INFO', message, details),
  warn: (message: string, details?: Record<string, any>) => log('WARN', message, details),
  error: (message: string, details?: Record<string, any>) => log('ERROR', message, details),
  debug: (message: string, details?: Record<string, any>) => log('DEBUG', message, details),
};
