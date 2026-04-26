import { useEffect } from "react";
import { getSocket, subscribeToPatientRoom } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import { useMonitorStore } from "../store/monitorStore";

export const useRealtimeMonitor = (patientId) => {
  const token = useAuthStore((state) => state.token);
  const ingestVitals = useMonitorStore((state) => state.ingestVitals);
  const ingestAlert = useMonitorStore((state) => state.ingestAlert);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket();

    const onVitals = (payload) => ingestVitals(payload);
    const onAlert = (payload) => ingestAlert(payload);

    socket.on("vitals:new", onVitals);
    socket.on("alerts:new", onAlert);

    return () => {
      socket.off("vitals:new", onVitals);
      socket.off("alerts:new", onAlert);
    };
  }, [token, ingestVitals, ingestAlert]);

  useEffect(() => {
    subscribeToPatientRoom(patientId);
  }, [patientId]);
};

