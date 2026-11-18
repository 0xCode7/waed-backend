const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 3 },
  role: {
    type: String,
    enum: ["admin", "teacher", "parent", "student"],
    required: true,
  },
  gender: { type: String, enum: ["male", "female"] },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  active: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
