const AppError = require("../utils/appError");

const validateRequest = (schema, property = "body") => (req, _res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(
      new AppError(
        "Validation failed",
        400,
        error.details.map((detail) => detail.message)
      )
    );
  }

  req[property] = value;
  return next();
};

module.exports = validateRequest;
