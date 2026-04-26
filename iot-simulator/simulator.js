const { processData } = require("./edgeProcessor");
const { INTERVAL } = require("./config/config.js");
const { log } = require("./utils/logger");

// patient profiles with unique baseline characteristics
const patients = [
  { id: "P1", name: "John Doe", baseHR: 72, baseTemp: 36.6, baseSpO2: 98, trend: "stable" },
  { id: "P2", name: "Jane Smith", baseHR: 85, baseTemp: 37.0, baseSpO2: 96, trend: "tachycardic" },
  { id: "P3", name: "Bob Wilson", baseHR: 65, baseTemp: 36.4, baseSpO2: 94, trend: "low_spo2" },
  { id: "P4", name: "Alice Brown", baseHR: 95, baseTemp: 37.5, baseSpO2: 97, trend: "feverish" },
  { id: "P5", name: "Charlie Davis", baseHR: 70, baseTemp: 36.7, baseSpO2: 99, trend: "healthy" },
];

// store current state to ensure gradual changes
const patientStates = {};

// initialize states
patients.forEach(p => {
  patientStates[p.id] = {
    heartRate: p.baseHR,
    temperature: p.baseTemp,
    spo2: p.baseSpO2,
    bloodPressure: { systolic: 120, diastolic: 80 }
  };
});

const generateVitals = (patient) => {
  const state = patientStates[patient.id];
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
    log("DEBUG", `Simulating HR Spike for ${patient.id}`);
  } else if (emergencyChance < 0.02) { // 1% chance for SpO2 drop
    finalSpO2 -= 10;
    log("DEBUG", `Simulating SpO2 Drop for ${patient.id}`);
  }

  // 5. Fault & Edge Cases (Requirement #8)
  const faultChance = Math.random();
  let data = {
    patientId: patient.id,
    heartRate: Math.round(finalHR),
    temperature: parseFloat(finalTemp.toFixed(1)),
    spo2: Math.round(finalSpO2),
    bloodPressure: `${Math.round(state.bloodPressure.systolic)}/${Math.round(state.bloodPressure.diastolic)}`,
    timestamp: now.toISOString(),
  };

  if (faultChance < 0.01) {
    log("WARN", `Simulating Missing Data Field for ${patient.id}`);
    delete data.heartRate; // Simulate missing field
  } else if (faultChance < 0.02) {
    log("WARN", `Simulating Sensor Noise (Extreme Value) for ${patient.id}`);
    data.temperature = 99.9; // Impossible value
  }

  return data;
};

// simulate each patient
const startSimulation = () => {
  log("INFO", `Starting simulation for ${patients.length} patients...`);
  patients.forEach((patient) => {
    setInterval(() => {
      const data = generateVitals(patient);
      processData(data);
    }, INTERVAL);
  });
};

startSimulation();