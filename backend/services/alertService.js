const Alert = require("../models/Alert");
const { resolvePatientByIdentifier } = require("./patientService");

const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) filter.$lte = new Date(endDate);
  return Object.keys(filter).length ? filter : null;
};

const getAlerts = async (query) => {
  const page = query.page || 1;
  const limit = query.limit || 30;
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.severity) {
    filter.severity = query.severity;
  }

  if (query.alertType) {
    filter.alertType = query.alertType.toUpperCase();
  }

  const timestampFilter = buildDateFilter(query.startDate, query.endDate);
  if (timestampFilter) {
    filter.timestamp = timestampFilter;
  }

  const [records, total] = await Promise.all([
    Alert.find(filter)
      .populate("patientId", "patientId name age gender bloodGroup")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    Alert.countDocuments(filter),
  ]);

  return {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    records,
  };
};

const getAlertsByPatient = async (patientIdentifier, query) => {
  const patient = await resolvePatientByIdentifier(patientIdentifier);
  const page = query.page || 1;
  const limit = query.limit || 30;
  const skip = (page - 1) * limit;

  const filter = {
    patientId: patient._id,
  };

  if (query.severity) {
    filter.severity = query.severity;
  }

  if (query.alertType) {
    filter.alertType = query.alertType.toUpperCase();
  }

  const timestampFilter = buildDateFilter(query.startDate, query.endDate);
  if (timestampFilter) {
    filter.timestamp = timestampFilter;
  }

  const [records, total] = await Promise.all([
    Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
    Alert.countDocuments(filter),
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
  getAlerts,
  getAlertsByPatient,
};
