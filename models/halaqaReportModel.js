const mongoose = require("mongoose");

const halaqaReportSchema = new mongoose.Schema({
  halaqa: { type: mongoose.Schema.Types.ObjectId, ref: "Halaqa", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  generalTopic: { type: String, trim: true },
  generalNotes: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model("HalaqaReport", halaqaReportSchema);
