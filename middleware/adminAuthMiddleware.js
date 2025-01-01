const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/errorHandler");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      const tokenParts = authHeader.split(" ");
      if (tokenParts.length === 2 && tokenParts[0].toLowerCase() === "bearer") {
        token = tokenParts[1];
      }
    }

    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError("Unauthorized: Token missing", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token", 401));
      }
      if (error.name === "TokenExpiredError") {
        return next(new AppError("Token expired", 401));
      }
      return next(new AppError("Authentication failed", 500));
    }

    if (!req.executeQuery) {
      return next(new AppError("Database query method not available", 500));
    }

    const result = await req.executeQuery("SELECT * FROM user_admin");

    if (!result || !result.recordset || result.recordset.length === 0) {
      return next(new AppError("No admin users found in the database", 404));
    }

    const adminUser = result.recordset.find(
      (user) => user.id === decoded.id || user.user_name === decoded.username
    );

    if (!adminUser) {
      return next(
        new AppError("Admin user not found", 403, {
          errorCode: "ADMIN_NOT_FOUND",
          validationErrors: {
            message: "Specified admin user does not exist",
          },
        })
      );
    }

    req.userData = {
      id: adminUser.id,
      username: adminUser.user_name,
    };

    next();
  } catch (error) {
    return next(
      new AppError("Internal authentication error", 500, {
        originalError: error.message,
      })
    );
  }
};
module.exports = adminAuthMiddleware;
