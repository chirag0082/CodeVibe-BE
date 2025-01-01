const app = require("express");
const router = app.Router();
const {
  getEmoSalaryReport,
} = require("../../../controllers/admin/adminEmploySalaryReportController");

router.get("/", getEmoSalaryReport);

module.exports = router;
