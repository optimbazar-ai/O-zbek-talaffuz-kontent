enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const logLevelMap: { [key: string]: LogLevel } = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR
};

const currentLogLevel = logLevelMap[process.env.LOG_LEVEL || 'info'];

function formatTime(): string {
  return new Date().toISOString();
}

function formatMessage(level: string, message: string, data?: any): string {
  const timestamp = formatTime();
  const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
}

export const logger = {
  debug: (message: string, data?: any) => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.log(formatMessage('debug', message, data));
    }
  },

  info: (message: string, data?: any) => {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log(formatMessage('info', message, data));
    }
  },

  warn: (message: string, data?: any) => {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error: (message: string, data?: any) => {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(formatMessage('error', message, data));
    }
  }
};
