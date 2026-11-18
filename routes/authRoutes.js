const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", authController.protect, authController.me);
router.post("/logout", authController.protect, authController.logout);

module.exports = router;
