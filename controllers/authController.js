const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { generateToken, generateRefreshToken } = require("../utils/generateToken");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  active: user.active,
  mustChangePassword: user.mustChangePassword,
});

const issueTokens = async (user) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  return { token, refreshToken };
};

exports.login = catchAsync(async (req, res) => {
  const phone = req.body.phone || req.body.username;
  const { password } = req.body;

  if (!phone || !password) throw new AppError("أدخل رقم الهاتف وكلمة السر", 400);

  const user = await User.findOne({ phone }).select("+password +refreshToken");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("بيانات التسجيل غير صحيحة", 401);
  }
  if (!user.active) throw new AppError("هذا الحساب غير مفعل", 403);

  res.status(200).json({
    success: true,
    data: { user: publicUser(user), ...(await issueTokens(user)) },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (!token) throw new AppError("سجل الدخول أولاً", 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || !user.active) throw new AppError("الحساب غير موجود أو غير مفعل", 401);

  req.user = user;
  next();
});

exports.allowTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new AppError("ليس لديك صلاحية", 403));
  next();
};

exports.requireChangedPassword = (req, res, next) => {
  if (req.user.mustChangePassword) {
    return next(new AppError("يجب تغيير كلمة المرور المؤقتة أولاً", 403));
  }
  next();
};

exports.me = (req, res) => res.json({ success: true, data: publicUser(req.user) });

exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError("Refresh token مطلوب", 400);

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== hashToken(refreshToken) || !user.active) {
    throw new AppError("Refresh token غير صالح", 401);
  }

  res.json({ success: true, data: await issueTokens(user) });
});

exports.logout = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res.json({ success: true, message: "تم تسجيل الخروج" });
});

exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError("أدخل كلمة المرور الحالية والجديدة", 400);
  }
  if (newPassword.length < 8) {
    throw new AppError("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف", 400);
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("كلمة المرور الحالية غير صحيحة", 401);
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  user.refreshToken = undefined;
  await user.save();

  res.json({
    success: true,
    message: "تم تغيير كلمة المرور بنجاح",
    data: { user: publicUser(user), ...(await issueTokens(user)) },
  });
});
