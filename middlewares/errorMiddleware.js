const AppError = require("../utils/appError");

exports.notFound = (req, res, next) => {
  next(new AppError(`المسار ${req.originalUrl} غير موجود`, 404));
};

exports.globalError = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "حدث خطأ في الخادم";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join("، ");
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = "هذه البيانات مسجلة من قبل";
  }
  if (err.name === "CastError") {
    statusCode = 400;
    message = "المعرّف غير صحيح";
  }
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "جلسة الدخول غير صالحة أو انتهت";
  }

  res.status(statusCode).json({ success: false, message });
};
