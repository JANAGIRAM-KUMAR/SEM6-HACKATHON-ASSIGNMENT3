const jwt = require("jsonwebtoken");
const config = require("../config/env");
const AppError = require("../utils/appError");

const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authorization token missing", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

module.exports = authMiddleware;
