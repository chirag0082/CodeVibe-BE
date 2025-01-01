require("dotenv").config();
const express = require("express");

const cors = require("cors");

const { errorResponse, AppError } = require("./utils/errorHandler");
const dbMiddleware = require("./middleware/dbMiddleware");

const adminCommonRoute = require("./routes/admin/common");
const adminEmployRegistrationRoute = require("./routes/admin/adminEmployRegistration");
const adminTraineeRegistrationRoute = require("./routes/admin/adminTraineeRegistrationRoute");
const adminEmploySalaryRoute = require("./routes/admin/adminEmploySalaryRoute");
const adminUserPayrollRoute = require("./routes/admin/adminUserPayrollRoute");
const adminEmployLeaveRoute = require("./routes/admin/adminEmployLeaveRoute");
const adminEmploySalaryReportRoute = require("./routes/admin/adminEmploySalaryReportRoute");
const adminCompanyLedgerRoute = require("./routes/admin/adminCompanyLedgerRoute");
const adminAuthMiddleware = require("./middleware/adminAuthMiddleware");

const userCommonRoute = require("./routes/user/userCommonRoute");
const userLeaveRoute = require("./routes/user/userLeaveRoute");
const userRoute = require("./routes/user/userRoute");

const checkToken = require("./middleware/authToken");
const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://codevibe.tech/"
        : "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "params"],
  })
);

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(dbMiddleware);

app.use("/admin", adminCommonRoute);

app.use("/admin", adminAuthMiddleware);
app.use("/admin/employ", adminEmployRegistrationRoute);
app.use("/admin/trainee", adminTraineeRegistrationRoute);
app.use("/admin/employ/salary", adminEmploySalaryRoute);
app.use("/admin/employ/payroll", adminUserPayrollRoute);
app.use("/admin/employ/leave", adminEmployLeaveRoute);
app.use("/admin/employ/report", adminEmploySalaryReportRoute);
app.use("/admin/ledger", adminCompanyLedgerRoute);

app.use("/", userCommonRoute);
app.use("/profile", checkToken, userRoute);
app.use("/leave", checkToken, userLeaveRoute);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  try {
    if (global.sqlPool) {
      await global.sqlPool.close();
      console.log("SQL Connection pool closed");
    }
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  try {
    if (global.sqlPool) {
      await global.sqlPool.close();
      console.log("SQL Connection pool closed");
    }
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
});

// Optional: Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  if (global.sqlPool) {
    global.sqlPool.close();
  }

  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);

  if (global.sqlPool) {
    global.sqlPool.close();
  }

  process.exit(1);
});

app.use(errorResponse);
