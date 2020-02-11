const winston = require('winston');
const t = require('./time');

const { createLogger, format } = winston;
const { combine, printf, timestamp } = format;


const prettyPrint = printf((info) => {
    return `${info.level} - ${t.tsFormat()}: ${JSON.stringify(info.message)}`;
});

const logger = createLogger({
    format: combine(timestamp(), prettyPrint),
    transports: [
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            // timestamp: tsFormat,
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

logger.add(new winston.transports.Console({
    // timestamp: tsFormat,
    format: printf((info) => {
        return `${info.level} ${t.tsFormat()}: ${JSON.stringify(info.message, null, 2)}`;
    }),
}));

module.exports = logger;
