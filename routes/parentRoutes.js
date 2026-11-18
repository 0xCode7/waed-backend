const express = require("express");
const auth = require("../controllers/authController");
const parent = require("../controllers/parentController");

const router = express.Router();

router.use(auth.protect, auth.requireChangedPassword, auth.allowTo("parent"));
router.get("/dashboard", parent.getDashboard);

module.exports = router;
