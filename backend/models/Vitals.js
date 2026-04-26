const mongoose = require("mongoose");

const vitalsSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    heartRate: {
      type: Number,
      required: true,
      min: 20,
      max: 250,
    },
    temperature: {
      type: Number,
      required: true,
      min: 30,
      max: 45,
    },
    spo2: {
      type: Number,
      required: true,
      min: 50,
      max: 100,
    },
    bloodPressure: {
      type: String,
      required: true,
      trim: true,
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

vitalsSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model("Vitals", vitalsSchema);
