require("dotenv").config();

module.exports = {
  API_BASE_URL: process.env.API_BASE_URL,
  INTERVAL: parseInt(process.env.INTERVAL) || 1500,
};