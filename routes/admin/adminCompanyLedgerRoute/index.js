const app = require("express");
const router = app.Router();
const {
  getAllLedger,
  createOrUpdateLedger,
  deleteLedger,
  getMonthlyReport,
  getYearlyReport,
  getDailyReport,
} = require("../../../controllers/admin/adminCompanyLedgerController");

router.get("/", getAllLedger);
router.get("/daily-report", getDailyReport);
router.get("/monthly-report/:year", getMonthlyReport);
router.get("/yearly-report", getYearlyReport);
router.post("/", createOrUpdateLedger);
router.delete("/:id", deleteLedger);

module.exports = router;
