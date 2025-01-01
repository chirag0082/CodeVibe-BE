const app = require("express");
const router = app.Router();

const { userLogin } = require("../../../controllers/user/userCommonController");

router.use("/login", userLogin);

module.exports = router;
