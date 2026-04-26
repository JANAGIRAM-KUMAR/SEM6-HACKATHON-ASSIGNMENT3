const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const AppError = require("../utils/appError");

const createPatient = async (payload) => {
  const normalizedPatientId = payload.patientId.toUpperCase();
  const existingPatient = await Patient.findOne({ patientId: normalizedPatientId });

  if (existingPatient) {
    throw new AppError("Patient already exists with this patientId", 409);
  }

  const patient = await Patient.create({
    ...payload,
    patientId: normalizedPatientId,
    gender: payload.gender.toUpperCase(),
    bloodGroup: payload.bloodGroup.toUpperCase(),
  });

  return patient.toJSON();
};

const getPatients = async () => {
  const patients = await Patient.find().sort({ createdAt: -1 });
  return patients.map((patient) => patient.toJSON());
};

const resolvePatientByIdentifier = async (identifier) => {
  let patient = null;
  const normalizedValue = String(identifier).trim();

  if (mongoose.Types.ObjectId.isValid(normalizedValue)) {
    patient = await Patient.findById(normalizedValue);
  }

  if (!patient) {
    patient = await Patient.findOne({ patientId: normalizedValue.toUpperCase() });
  }

  if (!patient) {
    throw new AppError(`Patient not found for identifier: ${identifier}`, 404);
  }

  return patient;
};

module.exports = {
  createPatient,
  getPatients,
  resolvePatientByIdentifier,
};
