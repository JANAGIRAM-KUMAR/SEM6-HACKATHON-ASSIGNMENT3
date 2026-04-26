const axios = require("axios");
const { processData, setAuthToken } = require("./edgeProcessor");
const { API_BASE_URL, AUTH_EMAIL, AUTH_PASSWORD, AUTH_NAME, INTERVAL } = require("./config/config.js");
const { log } = require("./utils/logger");

const seedPatients = [
  { patientId: "P1", name: "John Doe", age: 61, gender: "MALE", bloodGroup: "O+", baseHR: 72, baseTemp: 36.6, baseSpO2: 98 },
  { patientId: "P2", name: "Jane Smith", age: 49, gender: "FEMALE", bloodGroup: "A+", baseHR: 85, baseTemp: 37.0, baseSpO2: 96 },
  { patientId: "P3", name: "Bob Wilson", age: 67, gender: "MALE", bloodGroup: "B+", baseHR: 65, baseTemp: 36.4, baseSpO2: 94 },
  { patientId: "P4", name: "Alice Brown", age: 54, gender: "FEMALE", bloodGroup: "AB+", baseHR: 95, baseTemp: 37.5, baseSpO2: 97 },
  { patientId: "P5", name: "Charlie Davis", age: 40, gender: "MALE", bloodGroup: "O-", baseHR: 70, baseTemp: 36.7, baseSpO2: 99 },
];

// store current state to ensure gradual changes
const patientStates = {};

const initializeState = (patients) => {
  patients.forEach((p) => {
    patientStates[p.patientId] = {
      patientId: p.patientId,
    heartRate: p.baseHR,
    temperature: p.baseTemp,
    spo2: p.baseSpO2,
    bloodPressure: { systolic: 120, diastolic: 80 },
  };
  });
};

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRateLimitRetry = async (requestFn, maxRetries = 5) => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.response?.status !== 429 || attempt === maxRetries) {
        throw error;
      }
      const backoffMs = 1200 * (attempt + 1);
      log("WARN", `Rate limited by backend, retrying in ${backoffMs}ms`);
      await sleep(backoffMs);
      attempt += 1;
    }
  }
};

const registerOrLogin = async () => {
  try {
    const registerResponse = await withRateLimitRetry(() =>
      axios.post(`${API_BASE_URL}/auth/register`, {
        name: AUTH_NAME,
        email: AUTH_EMAIL,
        password: AUTH_PASSWORD,
        role: "DOCTOR",
      })
    );
    return registerResponse.data.data.token;
  } catch (error) {
    // If user exists (409) or registration is throttled (429), try login directly.
    if (error.response?.status !== 409 && error.response?.status !== 429) throw error;
    const loginResponse = await withRateLimitRetry(() =>
      axios.post(`${API_BASE_URL}/auth/login`, {
        email: AUTH_EMAIL,
        password: AUTH_PASSWORD,
      })
    );
    return loginResponse.data.data.token;
  }
};

const ensurePatients = async (token) => {
  const listResponse = await axios.get(`${API_BASE_URL}/patients`, authHeaders(token));
  const existing = listResponse.data.data || [];

  const existingCodes = new Set(existing.map((patient) => patient.patientId));
  for (const seed of seedPatients) {
    if (!existingCodes.has(seed.patientId)) {
      await axios.post(
        `${API_BASE_URL}/patients`,
        {
          patientId: seed.patientId,
          name: seed.name,
          age: seed.age,
          gender: seed.gender,
          bloodGroup: seed.bloodGroup,
        },
        authHeaders(token)
      );
      log("INFO", `Created patient ${seed.patientId}`);
    }
  }

  return seedPatients;
};

const generateVitals = (patient) => {
  const state = patientStates[patient.patientId];
  const now = new Date();
  const hour = now.getHours();

  // 1. Day/Night variation (lower HR/Temp at night 00:00 - 06:00)
  const isNight = hour >= 0 && hour <= 6;
  const nightHROffset = isNight ? -8 : 0;
  const nightTempOffset = isNight ? -0.3 : 0;

  // 2. Gradual changes (random walk)
  // Heart Rate: +/- 2 bpm
  const hrDelta = (Math.random() - 0.5) * 4;
  state.heartRate = Math.max(50, Math.min(180, state.heartRate + hrDelta));
  
  // Temperature: +/- 0.1 °C
  const tempDelta = (Math.random() - 0.5) * 0.2;
  state.temperature = Math.max(35, Math.min(41, state.temperature + tempDelta));

  // SpO2: minor fluctuations
  const spo2Delta = (Math.random() - 0.5) * 0.5;
  state.spo2 = Math.max(80, Math.min(100, state.spo2 + spo2Delta));

  // 3. Apply baseline tendencies and Night offsets
  let finalHR = state.heartRate + nightHROffset;
  let finalTemp = state.temperature + nightTempOffset;
  let finalSpO2 = state.spo2;

  // 4. Occasional abnormal spikes (simulating emergencies)
  const emergencyChance = Math.random();
  if (emergencyChance < 0.01) { // 1% chance for HR spike
    finalHR += 40;
    log("DEBUG", `Simulating HR Spike for ${patient.patientId}`);
  } else if (emergencyChance < 0.02) { // 1% chance for SpO2 drop
    finalSpO2 -= 10;
    log("DEBUG", `Simulating SpO2 Drop for ${patient.patientId}`);
  }

  // 5. Fault & Edge Cases (Requirement #8)
  const faultChance = Math.random();
  let data = {
    patientId: patient.patientId,
    heartRate: Math.round(finalHR),
    temperature: parseFloat(finalTemp.toFixed(1)),
    spo2: Math.round(finalSpO2),
    bloodPressure: `${Math.round(state.bloodPressure.systolic)}/${Math.round(state.bloodPressure.diastolic)}`,
    timestamp: now.toISOString(),
  };

  if (faultChance < 0.01) {
    log("WARN", `Simulating Missing Data Field for ${patient.patientId}`);
    delete data.heartRate; // Simulate missing field
  } else if (faultChance < 0.02) {
    log("WARN", `Simulating Sensor Noise (Extreme Value) for ${patient.patientId}`);
    data.temperature = 99.9; // Impossible value
  }

  return data;
};

// simulate each patient
const startSimulation = async () => {
  const token = await registerOrLogin();
  setAuthToken(token);
  const patients = await ensurePatients(token);
  initializeState(patients);

  log("INFO", `Starting simulation for ${patients.length} patients...`);
  patients.forEach((patient) => {
    setInterval(() => {
      const data = generateVitals(patient);
      processData(data);
    }, INTERVAL);
  });
};

startSimulation().catch((error) => {
  log("ERROR", "Unable to start simulator", error.response?.data?.message || error.message);
  process.exit(1);
});