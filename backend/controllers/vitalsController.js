const { ingestVitals, getVitalsHistoryByPatient } = require("../services/vitalsService");

const create = async (req, res) => {
  const result = await ingestVitals(req.body);
  res.status(201).json({
    success: true,
    message: "Vitals ingested successfully",
    data: result,
  });
};

const history = async (req, res) => {
  const result = await getVitalsHistoryByPatient(req.params.patientId, req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
};

module.exports = {
  create,
  history,
};
