const Vitals = require("../models/Vitals");
const Alert = require("../models/Alert");
const { resolvePatientByIdentifier } = require("./patientService");
const { evaluateRules } = require("./ruleEngineService");
const { getIo } = require("../config/socket");

const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return Object.keys(filter).length ? filter : null;
};

const emitVitalsAndAlerts = (patient, vitalsPayload, alertsPayload) => {
  try {
    const io = getIo();

    io.emit("vitals:new", vitalsPayload);
    io.to(`patient:${patient._id}`).emit("vitals:new", vitalsPayload);
    io.to(`patient:${patient.patientId}`).emit("vitals:new", vitalsPayload);

    alertsPayload.forEach((alert) => {
      io.emit("alerts:new", alert);
      io.to(`patient:${patient._id}`).emit("alerts:new", alert);
      io.to(`patient:${patient.patientId}`).emit("alerts:new", alert);
    });
  } catch (_error) {
    // Socket layer is optional for persistence; swallow when unavailable.
  }
};

const ingestVitals = async (payload) => {
  const patient = await resolvePatientByIdentifier(payload.patientId);
  // Step 1: store the vitals sample for time-series history.

  const vitalsDoc = await Vitals.create({
    patientId: patient._id,
    heartRate: payload.heartRate,
    temperature: payload.temperature,
    spo2: payload.spo2,
    bloodPressure: payload.bloodPressure,
    timestamp: payload.timestamp || new Date(),
  });

  const matchedRules = await evaluateRules({
    heartRate: payload.heartRate,
    temperature: payload.temperature,
    spo2: payload.spo2,
    bloodPressure: payload.bloodPressure,
  });

  let createdAlerts = [];
  // Step 2: convert matched rules into persisted alert documents.

  if (matchedRules.length) {
    const alertDocs = matchedRules.map((ruleMatch) => ({
      patientId: patient._id,
      alertType: ruleMatch.alertType,
      severity: ruleMatch.severity,
      message: ruleMatch.message,
      timestamp: vitalsDoc.timestamp,
    }));

    createdAlerts = await Alert.insertMany(alertDocs, { ordered: false });
  }

  const vitalsPayload = {
    id: vitalsDoc._id,
    patientId: patient._id,
    patientCode: patient.patientId,
    heartRate: vitalsDoc.heartRate,
    temperature: vitalsDoc.temperature,
    spo2: vitalsDoc.spo2,
    bloodPressure: vitalsDoc.bloodPressure,
    timestamp: vitalsDoc.timestamp,
  };

  const alertsPayload = createdAlerts.map((alertDoc) => ({
    id: alertDoc._id,
    patientId: alertDoc.patientId,
    patientCode: patient.patientId,
    alertType: alertDoc.alertType,
    message: alertDoc.message,
    severity: alertDoc.severity,
    timestamp: alertDoc.timestamp,
  }));
  // Step 3: push live updates for dashboard subscribers.

  emitVitalsAndAlerts(patient, vitalsPayload, alertsPayload);

  return {
    vitals: vitalsPayload,
    alerts: alertsPayload,
  };
};

const getVitalsHistoryByPatient = async (patientIdentifier, query) => {
  const patient = await resolvePatientByIdentifier(patientIdentifier);
  const page = query.page || 1;
  const limit = query.limit || 30;
  const skip = (page - 1) * limit;

  const filter = {
    patientId: patient._id,
  };

  const timestampFilter = buildDateFilter(query.startDate, query.endDate);

  if (timestampFilter) {
    filter.timestamp = timestampFilter;
  }

  const [records, total] = await Promise.all([
    Vitals.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    Vitals.countDocuments(filter),
  ]);

  return {
    patient: patient.toJSON(),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    records,
  };
};

module.exports = {
  ingestVitals,
  getVitalsHistoryByPatient,
};
