const express = require("express");
const auth = require("../controllers/authController");
const users = require("../controllers/userController");
const router = express.Router();

router.use(auth.protect, auth.requireChangedPassword, auth.allowTo("admin"));
router.route("/").get(users.getAllUsers).post(users.createUser);
router.route("/:id").get(users.getUser).patch(users.updateUser);

module.exports = router;
