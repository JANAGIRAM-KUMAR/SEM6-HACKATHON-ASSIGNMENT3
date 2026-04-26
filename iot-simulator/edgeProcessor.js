const axios = require("axios");
const rules = require("./rules.json");
const { API_BASE_URL } = require("./config/config.js");
const { log } = require("./utils/logger");

// validate incoming data
const validateData = (data) => {
  if (!data.heartRate || !data.temperature || !data.spo2) {
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
    await axios.post(`${API_BASE_URL}/vitals`, data);
    log("INFO", "Vitals sent", data);
  } catch (err) {
    log("ERROR", "Failed to send vitals", err.message);
  }
};

// send alerts
const sendAlerts = async (alerts) => {
  for (let alert of alerts) {
    try {
      await axios.post(`${API_BASE_URL}/alerts`, alert);
      log("ALERT", "Alert sent", alert);
    } catch (err) {
      log("ERROR", "Failed to send alert", err.message);
    }
  }
};

// main processor
const processData = async (data) => {
  try {
    validateData(data);

    const alerts = checkRules(data);

    await sendVitals(data);

    if (alerts.length > 0) {
      await sendAlerts(alerts);
    }
  } catch (err) {
    log("ERROR", "Processing failed", err.message);
  }
};

module.exports = { processData };