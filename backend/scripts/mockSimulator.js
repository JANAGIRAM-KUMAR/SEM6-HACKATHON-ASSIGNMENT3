const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const BASE_URL = process.env.SIMULATOR_BASE_URL || "http://localhost:5005";
const SIMULATOR_EMAIL = process.env.SIMULATOR_EMAIL || "simulator.admin@example.com";
const SIMULATOR_PASSWORD = process.env.SIMULATOR_PASSWORD || "Passw0rd!";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const patientProfiles = [
  {
    patientId: "P001",
    name: "Aarav Menon",
    age: 29,
    gender: "MALE",
    bloodGroup: "A+",
    baseline: { heartRate: 78, temperature: 36.8, spo2: 98, systolic: 118, diastolic: 76 },
    risk: "NORMAL",
  },
  {
    patientId: "P002",
    name: "Nisha Iyer",
    age: 47,
    gender: "FEMALE",
    bloodGroup: "B+",
    baseline: { heartRate: 86, temperature: 37.1, spo2: 95, systolic: 126, diastolic: 82 },
    risk: "LOW_SPO2",
  },
  {
    patientId: "P003",
    name: "Rahul Kapoor",
    age: 62,
    gender: "MALE",
    bloodGroup: "O-",
    baseline: { heartRate: 74, temperature: 36.6, spo2: 97, systolic: 132, diastolic: 84 },
    risk: "HIGH_BP",
  },
  {
    patientId: "P004",
    name: "Meera Reddy",
    age: 35,
    gender: "FEMALE",
    bloodGroup: "AB+",
    baseline: { heartRate: 92, temperature: 37.2, spo2: 96, systolic: 122, diastolic: 80 },
    risk: "HIGH_HR",
  },
  {
    patientId: "P005",
    name: "Arjun Das",
    age: 53,
    gender: "MALE",
    bloodGroup: "O+",
    baseline: { heartRate: 70, temperature: 36.7, spo2: 99, systolic: 116, diastolic: 74 },
    risk: "FEVER",
  },
];

const patientState = Object.fromEntries(
  patientProfiles.map((patient) => [
    patient.patientId,
    {
      heartRate: patient.baseline.heartRate,
      temperature: patient.baseline.temperature,
      spo2: patient.baseline.spo2,
      systolic: patient.baseline.systolic,
      diastolic: patient.baseline.diastolic,
    },
  ])
);

const random = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getDayNightHeartRateModifier = () => {
  const hour = new Date().getHours();
  if (hour >= 23 || hour <= 5) return 0.9;
  if (hour >= 6 && hour <= 9) return 1.03;
  return 1;
};

const applyGradualDrift = (current, baseline, magnitude, min, max) => {
  const driftTowardsBaseline = (baseline - current) * 0.15;
  const noise = random(-magnitude, magnitude);
  return clamp(current + driftTowardsBaseline + noise, min, max);
};

const maybeInjectEmergencySpike = (patient, snapshot) => {
  if (Math.random() > 0.04) return snapshot;

  switch (patient.risk) {
    case "LOW_SPO2":
      snapshot.spo2 = clamp(snapshot.spo2 - random(4, 9), 82, 100);
      break;
    case "HIGH_HR":
      snapshot.heartRate = clamp(snapshot.heartRate + random(18, 32), 50, 160);
      break;
    case "FEVER":
      snapshot.temperature = clamp(snapshot.temperature + random(1, 2), 35, 40);
      break;
    default:
      snapshot.heartRate = clamp(snapshot.heartRate + random(15, 24), 45, 160);
      snapshot.spo2 = clamp(snapshot.spo2 - random(2, 5), 85, 100);
      break;
  }

  return snapshot;
};

const buildVitalsPayload = (patient) => {
  const state = patientState[patient.patientId];
  const modifier = getDayNightHeartRateModifier();

  state.heartRate = applyGradualDrift(
    state.heartRate,
    patient.baseline.heartRate * modifier,
    2.2,
    45,
    160
  );
  state.temperature = applyGradualDrift(state.temperature, patient.baseline.temperature, 0.08, 35, 40);
  state.spo2 = applyGradualDrift(state.spo2, patient.baseline.spo2, 0.5, 82, 100);
  state.systolic = applyGradualDrift(state.systolic, patient.baseline.systolic, 1.8, 90, 180);
  state.diastolic = applyGradualDrift(state.diastolic, patient.baseline.diastolic, 1.2, 55, 120);

  const sample = maybeInjectEmergencySpike(patient, { ...state });
  const payload = {
    patientId: patient.patientId,
    heartRate: Number(sample.heartRate.toFixed(0)),
    temperature: Number(sample.temperature.toFixed(1)),
    spo2: Number(sample.spo2.toFixed(0)),
    bloodPressure: `${Math.round(sample.systolic)}/${Math.round(sample.diastolic)}`,
    timestamp: new Date().toISOString(),
  };

  if (Math.random() < 0.02) {
    delete payload.spo2;
  }

  return payload;
};

const getAuthToken = async () => {
  try {
    const registerResponse = await api.post("/api/auth/register", {
      name: "Simulator Admin",
      email: SIMULATOR_EMAIL,
      password: SIMULATOR_PASSWORD,
      role: "ADMIN",
    });
    return registerResponse.data.data.token;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      const loginResponse = await api.post("/api/auth/login", {
        email: SIMULATOR_EMAIL,
        password: SIMULATOR_PASSWORD,
      });
      return loginResponse.data.data.token;
    }
    throw error;
  }
};

const ensurePatients = async (token) => {
  const headers = { Authorization: `Bearer ${token}` };
  const listResponse = await api.get("/api/patients", { headers });
  const existingIds = new Set(listResponse.data.data.map((patient) => patient.patientId));

  for (const patient of patientProfiles) {
    if (existingIds.has(patient.patientId)) continue;
    await api.post("/api/patients", patient, { headers });
    console.log(`Created patient ${patient.patientId}`);
  }
};

const sendVitals = async (token, patient) => {
  const headers = { Authorization: `Bearer ${token}` };
  const payload = buildVitalsPayload(patient);

  try {
    const response = await api.post("/api/vitals", payload, { headers });
    const alertCount = response.data.data.alerts.length;
    console.log(
      `[${new Date().toISOString()}] ${patient.patientId} => HR:${payload.heartRate}, Temp:${payload.temperature}, SpO2:${payload.spo2 ?? "NA"}, BP:${payload.bloodPressure}, Alerts:${alertCount}`
    );
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    console.error(`[${new Date().toISOString()}] Failed to send vitals for ${patient.patientId}: ${message}`);
  }
};

const startPatientLoop = (token, patient) => {
  const loop = async () => {
    await sendVitals(token, patient);
    const intervalMs = Math.floor(random(1000, 2000));
    setTimeout(loop, intervalMs);
  };

  void loop();
};

const start = async () => {
  try {
    const token = await getAuthToken();
    await ensurePatients(token);
    console.log("Mock IoT simulator started for 5 patients.");
    patientProfiles.forEach((patient) => startPatientLoop(token, patient));
  } catch (error) {
    console.error("Simulator startup failed:", error.response?.data || error.message);
    process.exit(1);
  }
};

void start();
