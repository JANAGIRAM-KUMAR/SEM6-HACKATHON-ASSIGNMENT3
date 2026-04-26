const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const validateRequest = require("../middleware/validateRequest");
const { authSchemas } = require("../utils/validationSchemas");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  validateRequest(authSchemas.register),
  asyncHandler(authController.register)
);
router.post("/login", validateRequest(authSchemas.login), asyncHandler(authController.login));

module.exports = router;
