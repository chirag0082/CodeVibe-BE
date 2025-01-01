const app = require("express");
const router = app.Router();
const {
  getAllUserSalary,
  getAllUserSalaryByUserId,
  getAllUserSalaryBySalaryId,
  createOrUpdateUserSalary,
  deleteSalaryBySalaryId,
} = require("../../../controllers/admin/adminEmploySalaryController");

router.get("/", getAllUserSalary);
router.post("/", createOrUpdateUserSalary);
router.get("/user/:userId", getAllUserSalaryByUserId);
router.get("/salary/:salaryId", getAllUserSalaryBySalaryId);
router.delete("/:salaryId", deleteSalaryBySalaryId);

module.exports = router;
