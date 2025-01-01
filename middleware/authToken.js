const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/errorHandler");

const checkToken = (req, res, next) => {
  let headerToken = null;

  if (req.headers && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    const tokenParts = authHeader.split(" ");
    if (tokenParts.length === 2 && tokenParts[0].toLowerCase() === "bearer") {
      headerToken = tokenParts[1];
    }
  }

  let token = null;

  if (req.cookies) {
    token = req.cookies.token;
  }

  token = token || headerToken;

  if (!token) {
    return next(new AppError("Unauthorized: No token provided", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expired", 401));
    }

    return next(new AppError("Authentication failed", 500));
  }
};
module.exports = checkToken;
