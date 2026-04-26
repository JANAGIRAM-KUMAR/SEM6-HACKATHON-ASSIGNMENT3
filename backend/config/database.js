const mongoose = require("mongoose");
const config = require("./env");
const logger = require("../utils/logger");

const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri);
  logger.info("MongoDB connected successfully");
};

module.exports = connectDatabase;
