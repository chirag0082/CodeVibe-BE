const {
  catchAsync,
  AppError,
  sendSuccess,
} = require("../../utils/errorHandler");
const JWT = require("jsonwebtoken");

const adminLogin = catchAsync(async (req, res, next) => {
  const { userName, password } = req.body;

  if (!userName.trim() || !password.trim()) {
    return next(new AppError("Username and password are required", 400));
  }
  try {
    const result = await req.executeQuery(
      "SELECT * FROM user_admin WHERE user_name = @userName",
      { userName }
    );

    if (result.recordset.length === 0) {
      return next(new AppError("User not found", 404));
    }

    const user = result.recordset[0];

    const isPasswordValid = password === user.user_password;

    if (!isPasswordValid) {
      return next(new AppError("Invalid credentials", 401));
    }

    const token = JWT.sign(
      { id: user.id, userName: user.user_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "1d" }
    );

    sendSuccess(
      res,
      { token, id: user.id, userName: user.user_name },
      "Login successful"
    );
  } catch (error) {
    console.log("error::: ", error);
    next(error);
  }
});

module.exports = {
  adminLogin,
};
