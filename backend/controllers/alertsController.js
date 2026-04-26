const { getAlerts, getAlertsByPatient } = require("../services/alertService");

const list = async (req, res) => {
  const result = await getAlerts(req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
};

const byPatient = async (req, res) => {
  const result = await getAlertsByPatient(req.params.patientId, req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
};

module.exports = {
  list,
  byPatient,
};
