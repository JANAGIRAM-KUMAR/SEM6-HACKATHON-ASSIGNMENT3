const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { alertSchemas, paramsSchemas } = require("../utils/validationSchemas");
const alertsController = require("../controllers/alertsController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", validateRequest(alertSchemas.listQuery, "query"), asyncHandler(alertsController.list));
router.get(
  "/:patientId",
  validateRequest(paramsSchemas.patientIdParam, "params"),
  validateRequest(alertSchemas.listQuery, "query"),
  asyncHandler(alertsController.byPatient)
);

module.exports = router;
