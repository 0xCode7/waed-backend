const express = require("express");
const auth = require("../controllers/authController");
const students = require("../controllers/studentController");
const router = express.Router();

router.use(auth.protect);
router.route("/")
  .get(auth.allowTo("admin", "teacher", "parent"), students.getStudents)
  .post(auth.allowTo("admin"), students.createStudent);
router.get("/:id/follow-ups", auth.allowTo("admin", "teacher", "parent"), students.getStudentFollowUps);
router.route("/:id")
  .get(auth.allowTo("admin", "teacher", "parent"), students.getStudent)
  .patch(auth.allowTo("admin"), students.updateStudent);

module.exports = router;
