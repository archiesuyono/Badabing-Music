const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');

// Create logs directory if not exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };

  const logMessage = `[${timestamp}] [${level}] ${message}${data ? ` - ${JSON.stringify(data)}` : ''}`;

  // Console output
  if (level === 'error') {
    console.error(logMessage);
  } else if (level === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }

  // File output
  const logFile = path.join(logsDir, `${level}.log`);
  fs.appendFileSync(logFile, logMessage + '\n');
};

const logger = {
  info: (message, data) => log('info', message, data),
  warn: (message, data) => log('warn', message, data),
  error: (message, data) => log('error', message, data),
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      log('debug', message, data);
    }
  }
};

module.exports = logger;
