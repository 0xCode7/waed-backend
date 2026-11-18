const mongoose = require("mongoose");

const halaqaSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  schedule: [{ type: String, trim: true }],
  location: { type: String, trim: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Halaqa", halaqaSchema);
