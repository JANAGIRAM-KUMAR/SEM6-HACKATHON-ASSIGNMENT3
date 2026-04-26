import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5005", {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }

  return socket;
};

export const connectSocket = (token) => {
  const ioSocket = getSocket();
  if (token) {
    ioSocket.auth = { token };
  }
  if (!ioSocket.connected) {
    ioSocket.connect();
  }
  return ioSocket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

export const subscribeToPatientRoom = (patientId) => {
  if (!patientId || !socket?.connected) return;
  socket.emit("patient:subscribe", patientId);
};

