const express = require("express");
const authRoutes = require("./authRoutes");
const patientRoutes = require("./patientRoutes");
const vitalsRoutes = require("./vitalsRoutes");
const alertRoutes = require("./alertRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/vitals", vitalsRoutes);
router.use("/alerts", alertRoutes);

module.exports = router;
