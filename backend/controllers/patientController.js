const { createPatient, getPatients } = require("../services/patientService");

const create = async (req, res) => {
  const patient = await createPatient(req.body);
  res.status(201).json({
    success: true,
    message: "Patient created successfully",
    data: patient,
  });
};

const list = async (_req, res) => {
  const patients = await getPatients();
  res.status(200).json({
    success: true,
    data: patients,
  });
};

module.exports = {
  create,
  list,
};
