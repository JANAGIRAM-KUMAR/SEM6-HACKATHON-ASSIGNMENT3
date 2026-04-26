const config = require("../config/env");
const logger = require("../utils/logger");

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  logger.error({
    message,
    statusCode,
    stack: error.stack,
    details: error.details || null,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      details: error.details || null,
      ...(config.nodeEnv !== "production" ? { stack: error.stack } : {}),
    },
  });
};

module.exports = errorHandler;
