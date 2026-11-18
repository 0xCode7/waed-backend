const express = require("express");
const auth = require("../controllers/authController");
const halaqas = require("../controllers/halaqaController");
const router = express.Router();

router.use(auth.protect, auth.allowTo("admin", "teacher"));
router.route("/").get(halaqas.getHalaqas).post(auth.allowTo("admin"), halaqas.createHalaqa);
router.route("/:id").get(halaqas.getHalaqa).patch(auth.allowTo("admin"), halaqas.updateHalaqa);

module.exports = router;
