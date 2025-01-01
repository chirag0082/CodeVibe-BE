const app = require("express");
const router = app.Router();
const {
  leaveRequest,
  getLeaveHistory,
} = require("../../../controllers/user/userLeaveController");

router.post("/request", leaveRequest);
router.get("/status", getLeaveHistory);

module.exports = router;
