const express = require("express");
const auth = require("../controllers/authController");
const reports = require("../controllers/reportController");
const router = express.Router();

router.use(auth.protect, auth.requireChangedPassword, auth.allowTo("admin", "teacher"));
router.route("/").get(reports.getReports).post(reports.createReport);
router.post("/:reportId/follow-ups", reports.saveFollowUp);
router.route("/:id").get(reports.getReport).patch(reports.updateReport);

module.exports = router;
