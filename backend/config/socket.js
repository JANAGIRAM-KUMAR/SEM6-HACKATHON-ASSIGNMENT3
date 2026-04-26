const { Server } = require("socket.io");
const config = require("./env");
const logger = require("../utils/logger");

let ioInstance;

const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("patient:subscribe", (patientIdentifier) => {
      if (!patientIdentifier) return;
      socket.join(`patient:${patientIdentifier}`);
      logger.info(`Socket ${socket.id} joined room patient:${patientIdentifier}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIo = () => {
  if (!ioInstance) {
    throw new Error("Socket.io is not initialized");
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIo,
};
