require("dotenv").config();

module.exports = {
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5005/api",
  INTERVAL: parseInt(process.env.INTERVAL) || 1500,
  AUTH_EMAIL: process.env.AUTH_EMAIL || "simulator@hospital.dev",
  AUTH_PASSWORD: process.env.AUTH_PASSWORD || "Simulator@123",
  AUTH_NAME: process.env.AUTH_NAME || "IoT Simulator",
};