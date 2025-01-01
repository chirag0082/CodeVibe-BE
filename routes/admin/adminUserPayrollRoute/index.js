const app = require("express");
const router = app.Router();

const {
  getAllUserPayrollController,
  calculatePayroll,
} = require("../../../controllers/admin/adminUserPayrollController");

router.get("/", getAllUserPayrollController);
router.post("/", calculatePayroll);

module.exports = router;
