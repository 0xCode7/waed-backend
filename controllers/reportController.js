const Halaqa = require("../models/halaqaModel");
const HalaqaReport = require("../models/halaqaReportModel");
const FollowUp = require("../models/studentFollowUpModel");
const Student = require("../models/studentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const canUseHalaqa = async (user, halaqaId) => {
  const filter = { _id: halaqaId };
  if (user.role === "teacher") filter.teacher = user._id;
  return Halaqa.findOne(filter);
};

exports.getReports = catchAsync(async (req, res) => {
  const filter = {};
  if (req.user.role === "teacher") filter.teacher = req.user._id;
  if (req.query.halaqa) filter.halaqa = req.query.halaqa;
  const reports = await HalaqaReport.find(filter)
    .populate("halaqa", "name")
    .populate("teacher", "name")
    .sort("-date");
  res.json({ success: true, results: reports.length, data: reports });
});

exports.getReport = catchAsync(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === "teacher") filter.teacher = req.user._id;
  const report = await HalaqaReport.findOne(filter).populate("halaqa", "name").populate("teacher", "name");
  if (!report) throw new AppError("التقرير غير موجود أو ليس لديك صلاحية", 404);
  const followUps = await FollowUp.find({ report: report._id }).populate("student", "fullName");
  res.json({ success: true, data: { report, followUps } });
});

exports.createReport = catchAsync(async (req, res) => {
  const halaqa = await canUseHalaqa(req.user, req.body.halaqa);
  if (!halaqa) throw new AppError("الحلقة غير موجودة أو ليست تابعة لك", 403);
  const report = await HalaqaReport.create({ ...req.body, teacher: halaqa.teacher });
  res.status(201).json({ success: true, data: report });
});

exports.updateReport = catchAsync(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role === "teacher") filter.teacher = req.user._id;
  const allowed = ["date", "generalTopic", "generalNotes"];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  const report = await HalaqaReport.findOneAndUpdate(filter, updates, { new: true, runValidators: true });
  if (!report) throw new AppError("التقرير غير موجود أو ليس لديك صلاحية", 404);
  res.json({ success: true, data: report });
});

exports.saveFollowUp = catchAsync(async (req, res) => {
  const reportFilter = { _id: req.params.reportId };
  if (req.user.role === "teacher") reportFilter.teacher = req.user._id;
  const report = await HalaqaReport.findOne(reportFilter);
  if (!report) throw new AppError("التقرير غير موجود أو ليس لديك صلاحية", 404);

  const student = await Student.findOne({ _id: req.body.student, halaqa: report.halaqa });
  if (!student) throw new AppError("الطالب غير موجود في هذه الحلقة", 400);

  const followUp = await FollowUp.findOneAndUpdate(
    { report: report._id, student: student._id },
    { ...req.body, report: report._id, student: student._id },
    { new: true, upsert: true, runValidators: true },
  );
  res.status(201).json({ success: true, data: followUp });
});
