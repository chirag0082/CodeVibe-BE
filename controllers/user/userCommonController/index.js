const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  catchAsync,
  AppError,
  sendSuccess,
} = require("../../../utils/errorHandler");

const userLogin = catchAsync(async (req, res, next) => {
  const { userName, password } = req.body;

  if (
    !userName ||
    userName.trim() === "" ||
    !password ||
    password.trim() === ""
  ) {
    return next(new AppError("Username and password are required", 400));
  }

  const result = await req.executeQuery(
    "SELECT user_name,user_password,emp_id FROM emp_master WHERE user_name = @userName",
    { userName }
  );

  if (result.recordset.length === 0) {
    return next(new AppError("User not found", 404));
  }

  const user = result.recordset[0];

  const isPasswordValid = await bcrypt.compare(password, user.user_password);

  if (!isPasswordValid) {
    return next(new AppError("Invalid credentials", 401));
  }

  const token = jwt.sign(
    { id: user.emp_id, userName: user.user_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "1d" }
  );

  sendSuccess(
    res,
    { token, id: user.id, userName: user.user_name },
    "Login successful"
  );
});

module.exports = {
  userLogin,
};
