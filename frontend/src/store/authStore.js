import { create } from "zustand";
import { api } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const STORAGE_KEY = "pms_auth";

const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

const resolveApiErrorMessage = (error, fallbackMessage) => {
  const apiError = error?.response?.data?.error;
  if (Array.isArray(apiError?.details) && apiError.details.length) {
    return apiError.details[0];
  }
  return apiError?.message || error?.response?.data?.message || fallbackMessage;
};

export const useAuthStore = create((set) => ({
  token: persisted?.token || null,
  user: persisted?.user || null,
  isLoading: false,
  error: "",
  setError: (error) => set({ error }),
  register: async (payload) => {
    set({ isLoading: true, error: "" });
    try {
      const response = await api.post("/auth/register", payload);
      const auth = response.data.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      connectSocket(auth.token);
      set({ token: auth.token, user: auth.user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: resolveApiErrorMessage(error, "Registration failed") });
      throw error;
    }
  },
  login: async (payload) => {
    set({ isLoading: true, error: "" });
    try {
      const response = await api.post("/auth/login", payload);
      const auth = response.data.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      connectSocket(auth.token);
      set({ token: auth.token, user: auth.user, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: resolveApiErrorMessage(error, "Login failed") });
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    disconnectSocket();
    set({ token: null, user: null, error: "" });
  },
}));

