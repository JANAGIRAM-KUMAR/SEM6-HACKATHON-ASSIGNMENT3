const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validateRequest = require("../middleware/validateRequest");
const authMiddleware = require("../middleware/authMiddleware");
const { patientSchemas } = require("../utils/validationSchemas");
const patientController = require("../controllers/patientController");

const router = express.Router();

router.use(authMiddleware);
router.post("/", validateRequest(patientSchemas.create), asyncHandler(patientController.create));
router.get("/", asyncHandler(patientController.list));

module.exports = router;
