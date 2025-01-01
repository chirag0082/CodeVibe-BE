const app = require("express");
const router = app.Router();
const {
  registration,
  getAllTrainee,
  traineeComplete,
  traineeCompleteNull
} = require("../../../controllers/admin/adminTraineeRegistrationController");

router.post("/", registration);
router.get("/", getAllTrainee);
router.post("/complete", traineeComplete);
router.post("/complete-null", traineeCompleteNull);

module.exports = router;
