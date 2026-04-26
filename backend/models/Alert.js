const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    alertType: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ["LOW", "MEDIUM", "HIGH"],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

alertSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model("Alert", alertSchema);
