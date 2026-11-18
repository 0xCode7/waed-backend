const mongoose = require("mongoose");

const studentFollowUpSchema = new mongoose.Schema({
  report: { type: mongoose.Schema.Types.ObjectId, ref: "HalaqaReport", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  attendance: {
    type: String,
    enum: ["present", "absent", "excused", "late"],
    required: true,
  },
  newMemorization: { type: String, trim: true },
  revision: { type: String, trim: true },
  recitationRating: { type: String, trim: true },
  behaviorRating: { type: String, trim: true },
  homework: { type: String, trim: true },
  teacherNotes: { type: String, trim: true },
}, { timestamps: true });

studentFollowUpSchema.index({ report: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("StudentFollowUp", studentFollowUpSchema);
