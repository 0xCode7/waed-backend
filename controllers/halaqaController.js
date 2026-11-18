const Halaqa = require("../models/halaqaModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getHalaqas = catchAsync(async (req, res) => {
  const filter = req.user.role === "teacher" ? { teacher: req.user._id } : {};
  const halaqas = await Halaqa.find(filter).populate("teacher", "name phone");
  res.json({ success: true, results: halaqas.length, data: halaqas });
});

exports.getHalaqa = catchAsync(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === "teacher") filter.teacher = req.user._id;
  const halaqa = await Halaqa.findOne(filter).populate("teacher", "name phone");
  if (!halaqa) throw new AppError("الحلقة غير موجودة أو ليس لديك صلاحية", 404);
  res.json({ success: true, data: halaqa });
});

exports.createHalaqa = catchAsync(async (req, res) => {
  const teacher = await User.findOne({ _id: req.body.teacher, role: "teacher" });
  if (!teacher) throw new AppError("حساب المعلم غير صحيح", 400);
  const halaqa = await Halaqa.create(req.body);
  res.status(201).json({ success: true, data: halaqa });
});

exports.updateHalaqa = catchAsync(async (req, res) => {
  const halaqa = await Halaqa.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!halaqa) throw new AppError("الحلقة غير موجودة", 404);
  res.json({ success: true, data: halaqa });
});
