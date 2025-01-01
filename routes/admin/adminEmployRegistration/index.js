const app = require("express");
const router = app.Router();

const {
  registration,
  getAllEmploy,
  empResign,
  empResignNull,
  getAllEmployName,
} = require("../../../controllers/admin/adminEmployRegistrationController");

router.post("/", registration);
router.get("/", getAllEmploy);
router.get("/only", getAllEmployName);
router.post("/resign", empResign);
router.post("/emp-resign", empResignNull);

module.exports = router;
