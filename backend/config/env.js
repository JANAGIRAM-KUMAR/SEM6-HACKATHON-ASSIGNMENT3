const dotenv = require("dotenv");

dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  encryptionKey: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "dev_encryption_key",
  rateLimitWindowMinutes: Number(process.env.RATE_LIMIT_WINDOW) || 15,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
  corsOrigin: process.env.CORS_ORIGIN || "*",
};

const required = ["MONGO_URI", "JWT_SECRET"];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

module.exports = config;
