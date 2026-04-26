const rateLimit = require("express-rate-limit");
const config = require("../config/env");

const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMinutes * 60 * 1000,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests, please try again later.",
    },
  },
});

module.exports = rateLimiter;
