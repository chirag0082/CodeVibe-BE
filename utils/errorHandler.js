class AppError extends Error {
  constructor(message, statusCode, customData = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.customData = customData;

    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const errorResponse = (err, req, res, next) => {
  console.log("err::: ", err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    success: false,
    ...(err.customData && { data: err.customData }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    status: "success",
    success: true,
    message,
    data,
  });
};

module.exports = {
  AppError,
  catchAsync,
  errorResponse,
  sendSuccess,
};
