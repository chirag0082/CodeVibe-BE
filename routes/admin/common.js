const app = require("express");
const { adminLogin } = require("../../controllers/admin/commonController");
const router = app.Router();

router.post("/login", adminLogin);

module.exports = router;
