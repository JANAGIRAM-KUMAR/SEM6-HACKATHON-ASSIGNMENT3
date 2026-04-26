const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const config = require("./config/env");
const connectDatabase = require("./config/database");
const { initSocket } = require("./config/socket");

const requestLogger = require("./middleware/requestLogger");
const rateLimiter = require("./middleware/rateLimiter");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const apiRoutes = require("./routes");
const logger = require("./utils/logger");

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);
app.use(rateLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  await connectDatabase();
  server.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`);
  });
};

startServer().catch((error) => {
  logger.error({ message: "Unable to start server", error: error.message, stack: error.stack });
  process.exit(1);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully.");
  server.close(() => process.exit(0));
});
