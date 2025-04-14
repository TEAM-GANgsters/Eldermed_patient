const winston = require('winston');
const config = require('../config');

// Define the custom settings for each transport
const options = {
  console: {
    level: config.logging.level || 'info',
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    )
  }
};

// Instantiate a new Winston logger
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(options.console)
  ],
  exitOnError: false // Do not exit on handled exceptions
});

// Create a stream object with a 'write' function that will be used by Morgan
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  }
};

module.exports = logger; 