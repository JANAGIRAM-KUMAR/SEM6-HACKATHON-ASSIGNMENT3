const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { vitalsSchemas, paramsSchemas } = require("../utils/validationSchemas");
const vitalsController = require("../controllers/vitalsController");

const router = express.Router();

router.use(authMiddleware);
router.post("/", validateRequest(vitalsSchemas.create), asyncHandler(vitalsController.create));
router.get(
  "/:patientId",
  validateRequest(paramsSchemas.patientIdParam, "params"),
  validateRequest(vitalsSchemas.historyQuery, "query"),
  asyncHandler(vitalsController.history)
);

module.exports = router;
