const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/env");
const AppError = require("../utils/appError");

const signToken = (user) =>
  jwt.sign({ userId: user._id.toString(), role: user.role, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  createdAt: userDoc.createdAt,
});

const registerUser = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    password: payload.password,
    role: payload.role || "DOCTOR",
  });

  const token = signToken(user);

  return {
    token,
    user: sanitizeUser(user),
  };
};

const loginUser = async (payload) => {
  const user = await User.findOne({ email: payload.email.toLowerCase() }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValidPassword = await user.comparePassword(payload.password);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(user);

  return {
    token,
    user: sanitizeUser(user),
  };
};

module.exports = {
  registerUser,
  loginUser,
};
