const app = require("express");
const router = app.Router();
const { getUserProfile } = require("../../../controllers/user/userController");

router.get("/", getUserProfile);

module.exports = router;
