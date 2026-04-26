import { create } from "zustand";
import { api } from "../services/api";
import { MAX_LIVE_POINTS } from "../utils/medical";

const toId = (value) => String(value);

export const useMonitorStore = create((set, get) => ({
  patients: [],
  selectedPatientId: "",
  vitalsByPatient: {},
  alertsByPatient: {},
  isLoadingPatients: false,
  isLoadingVitals: false,
  isLoadingAlerts: false,
  error: "",

  setSelectedPatientId: (patientId) => set({ selectedPatientId: patientId }),

  fetchPatients: async () => {
    set({ isLoadingPatients: true, error: "" });
    try {
      const response = await api.get("/patients");
      const patients = response.data.data || [];
      const fallbackSelected = get().selectedPatientId || (patients[0]?.id ?? "");
      set({ patients, selectedPatientId: fallbackSelected, isLoadingPatients: false });
      return patients;
    } catch (error) {
      set({
        isLoadingPatients: false,
        error: error.response?.data?.message || "Unable to load patients",
      });
      return [];
    }
  },

  fetchVitals: async (patientId) => {
    if (!patientId) return;
    set({ isLoadingVitals: true });
    try {
      const response = await api.get(`/vitals/${patientId}`, { params: { page: 1, limit: 50 } });
      const records = (response.data.data?.records || []).slice().reverse();
      set((state) => ({
        vitalsByPatient: { ...state.vitalsByPatient, [toId(patientId)]: records },
        isLoadingVitals: false,
      }));
    } catch (error) {
      set({
        isLoadingVitals: false,
        error: error.response?.data?.message || "Unable to load vitals history",
      });
    }
  },

  fetchAlerts: async (patientId) => {
    if (!patientId) return;
    set({ isLoadingAlerts: true });
    try {
      const response = await api.get(`/alerts/${patientId}`, { params: { page: 1, limit: 50 } });
      const records = response.data.data?.records || [];
      set((state) => ({
        alertsByPatient: { ...state.alertsByPatient, [toId(patientId)]: records },
        isLoadingAlerts: false,
      }));
    } catch (error) {
      set({
        isLoadingAlerts: false,
        error: error.response?.data?.message || "Unable to load alerts",
      });
    }
  },

  ingestVitals: (payload) =>
    set((state) => {
      const key = toId(payload.patientId);
      const previous = state.vitalsByPatient[key] || [];
      const next = [...previous, payload].slice(-MAX_LIVE_POINTS);
      return {
        vitalsByPatient: { ...state.vitalsByPatient, [key]: next },
      };
    }),

  ingestAlert: (payload) =>
    set((state) => {
      const key = toId(payload.patientId);
      const previous = state.alertsByPatient[key] || [];
      const next = [payload, ...previous].slice(0, MAX_LIVE_POINTS);
      return {
        alertsByPatient: { ...state.alertsByPatient, [key]: next },
      };
    }),
}));

