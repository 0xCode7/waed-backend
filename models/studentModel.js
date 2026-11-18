const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 3, max: 100 },
  gender: { type: String, enum: ["male", "female"], required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  halaqa: { type: mongoose.Schema.Types.ObjectId, ref: "Halaqa", default: null },
  active: { type: Boolean, default: true },
  userAccount: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
