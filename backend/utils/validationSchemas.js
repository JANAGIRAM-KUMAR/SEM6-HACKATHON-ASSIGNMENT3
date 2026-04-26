const Joi = require("joi");

const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const bpPattern = /^\d{2,3}\/\d{2,3}$/;

const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(64).required(),
    role: Joi.string().valid("ADMIN", "DOCTOR").optional(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const patientSchemas = {
  create: Joi.object({
    patientId: Joi.string().trim().min(2).max(30).required(),
    name: Joi.string().min(2).max(100).required(),
    age: Joi.number().integer().min(0).max(130).required(),
    gender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),
    bloodGroup: Joi.string()
      .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
      .required(),
  }),
};

const vitalsSchemas = {
  create: Joi.object({
    patientId: Joi.string().trim().required(),
    heartRate: Joi.number().min(20).max(250).required(),
    temperature: Joi.number().min(30).max(45).required(),
    spo2: Joi.number().min(50).max(100).required(),
    bloodPressure: Joi.string().pattern(bpPattern).required(),
    timestamp: Joi.date().iso().optional(),
  }),
  historyQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(30),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
};

const alertSchemas = {
  listQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(30),
    severity: Joi.string().valid("LOW", "MEDIUM", "HIGH").optional(),
    alertType: Joi.string().trim().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
};

const paramsSchemas = {
  patientIdParam: Joi.object({
    patientId: Joi.string().trim().required(),
  }),
  mongoIdParam: Joi.object({
    id: Joi.string().pattern(objectIdPattern).required(),
  }),
};

module.exports = {
  authSchemas,
  patientSchemas,
  vitalsSchemas,
  alertSchemas,
  paramsSchemas,
};
