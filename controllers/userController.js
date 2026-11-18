const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAllUsers = catchAsync(async (req, res) => {
  const filter = req.query.role ? { role: req.query.role } : {};
  const users = await User.find(filter).sort("-createdAt");
  res.json({ success: true, results: users.length, data: users });
});

exports.getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("المستخدم غير موجود", 404);
  res.json({ success: true, data: user });
});

exports.createUser = catchAsync(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});

exports.updateUser = catchAsync(async (req, res) => {
  const allowed = ["name", "phone", "gender", "role", "active"];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError("المستخدم غير موجود", 404);
  res.json({ success: true, data: user });
});
