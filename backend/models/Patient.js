const mongoose = require("mongoose");
const { encryptValue, decryptValue } = require("../utils/encryption");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      set: encryptValue,
      get: decryptValue,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 130,
    },
    gender: {
      type: String,
      required: true,
      enum: ["MALE", "FEMALE", "OTHER"],
    },
    bloodGroup: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      getters: true,
    },
  }
);

module.exports = mongoose.model("Patient", patientSchema);
