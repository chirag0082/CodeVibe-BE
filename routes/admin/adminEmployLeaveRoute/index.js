const app = require("express");
const router = app.Router();
const {
  getAllPendingRequest,
  approveRequest,
  getAllLeaveHistory,
  deleteRequest,
} = require("../../../controllers/admin/adminEmployLeaveController");

router.get("/", getAllLeaveHistory);
router.get("/pending", getAllPendingRequest);
router.post("/", approveRequest);
router.delete("/:leaveId", deleteRequest);

module.exports = router;
