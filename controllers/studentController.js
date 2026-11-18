const Student = require("../models/studentModel");
const User = require("../models/userModel");
const Halaqa = require("../models/halaqaModel");
const FollowUp = require("../models/studentFollowUpModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const studentQueryFor = async (user) => {
  if (user.role === "parent") return { parent: user._id };
  if (user.role === "teacher") {
    const halaqas = await Halaqa.find({ teacher: user._id }).select("_id");
    return { halaqa: { $in: halaqas.map((item) => item._id) } };
  }
  return {};
};

exports.getStudents = catchAsync(async (req, res) => {
  const students = await Student.find(await studentQueryFor(req.user))
    .populate("parent", "name phone")
    .populate("halaqa", "name");
  res.json({ success: true, results: students.length, data: students });
});

exports.getStudent = catchAsync(async (req, res) => {
  const filter = { _id: req.params.id, ...(await studentQueryFor(req.user)) };
  const student = await Student.findOne(filter).populate("parent", "name phone").populate("halaqa", "name");
  if (!student) throw new AppError("الطالب غير موجود أو ليس لديك صلاحية", 404);
  res.json({ success: true, data: student });
});

exports.createStudent = catchAsync(async (req, res) => {
  const parent = await User.findOne({ _id: req.body.parent, role: "parent" });
  if (!parent) throw new AppError("حساب ولي الأمر غير صحيح", 400);
  const student = await Student.create(req.body);
  res.status(201).json({ success: true, data: student });
});

exports.updateStudent = catchAsync(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!student) throw new AppError("الطالب غير موجود", 404);
  res.json({ success: true, data: student });
});

exports.getStudentFollowUps = catchAsync(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, ...(await studentQueryFor(req.user)) });
  if (!student) throw new AppError("الطالب غير موجود أو ليس لديك صلاحية", 404);
  const followUps = await FollowUp.find({ student: student._id })
    .populate({ path: "report", select: "date generalTopic generalNotes halaqa", populate: { path: "halaqa", select: "name" } })
    .sort("-createdAt");
  res.json({ success: true, results: followUps.length, data: followUps });
});
