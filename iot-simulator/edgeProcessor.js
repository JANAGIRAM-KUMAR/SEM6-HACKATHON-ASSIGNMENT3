const axios = require("axios");
const rules = require("./rules.json");
const { API_BASE_URL } = require("./config/config.js");
const { log } = require("./utils/logger");

let authToken = "";

const setAuthToken = (token) => {
  authToken = token;
};

const authHeaders = () =>
  authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : {};

// validate incoming data
const validateData = (data) => {
  if (
    data.heartRate === undefined ||
    data.temperature === undefined ||
    data.spo2 === undefined ||
    !data.bloodPressure
  ) {
    throw new Error("Missing vital fields");
  }

  if (data.heartRate < 30 || data.heartRate > 200) {
    throw new Error("Invalid heart rate");
  }

  return true;
};

// apply DSL rules
const checkRules = (data) => {
  let alerts = [];

  rules.forEach((rule) => {
    const value = data[rule.field];

    let condition = false;

    switch (rule.operator) {
      case ">":
        condition = value > rule.value;
        break;
      case "<":
        condition = value < rule.value;
        break;
      case ">=":
        condition = value >= rule.value;
        break;
      case "<=":
        condition = value <= rule.value;
        break;
      case "==":
        condition = value == rule.value;
        break;
    }

    if (condition) {
      alerts.push({
        patientId: data.patientId,
        alertType: rule.alert,
        severity: rule.severity,
        message: `${rule.field} abnormal`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return alerts;
};

// send data to backend
const sendVitals = async (data) => {
  try {
    await axios.post(`${API_BASE_URL}/vitals`, data, authHeaders());
    log("INFO", `Vitals sent for ${data.patientId}`);
  } catch (err) {
    log("ERROR", "Failed to send vitals", err.response?.data?.message || err.message);
  }
};

// main processor
const processData = async (data) => {
  try {
    validateData(data);

    const alerts = checkRules(data);

    await sendVitals(data);

    if (alerts.length > 0) {
      // Alerts are persisted and emitted by backend rule engine.
      log("ALERT", `Rule matches for ${data.patientId}`, alerts);
    }
  } catch (err) {
    log("ERROR", "Processing failed", err.message);
  }
};

module.exports = { processData, setAuthToken };