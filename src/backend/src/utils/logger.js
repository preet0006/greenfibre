/**
 * Structured Logger for Green Fibre Backend
 * Provides timestamped info, warn, and error levels
 */
const formatMessage = (level, message, meta) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
    info: (msg, meta = {}) => {
        process.stdout.write(formatMessage("info", msg, meta) + "\n");
    },
    warn: (msg, meta = {}) => {
        process.stderr.write(formatMessage("warn", msg, meta) + "\n");
    },
    error: (msg, meta = {}) => {
        process.stderr.write(formatMessage("error", msg, meta) + "\n");
    },
    debug: (msg, meta = {}) => {
        if (process.env.DEBUG === "true" || process.env.NODE_ENV !== "production") {
            process.stdout.write(formatMessage("debug", msg, meta) + "\n");
        }
    },
};

export default logger;
