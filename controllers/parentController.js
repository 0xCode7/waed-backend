const Student = require("../models/studentModel");
const FollowUp = require("../models/studentFollowUpModel");
const catchAsync = require("../utils/catchAsync");

function summarizeAttendance(records) {
  const count = (status) => records.filter((item) => item.attendance === status).length;
  const present = count("present");
  const late = count("late");
  const absent = count("absent");
  const excused = count("excused");
  const recorded = present + late + absent + excused;
  const percent = recorded ? Math.round(((present + late) / recorded) * 100) : null;
  return { present, late, absent, excused, recorded, percent };
}

function formatReport(followUp) {
  if (!followUp?.report) return null;
  const report = followUp.report;
  return {
    id: followUp._id,
    date: report.date,
    teacher: report.teacher?.name || "—",
    period: report.generalTopic || "تقرير الحلقة",
    levels: {
      memorization: followUp.recitationRating || "—",
      review: followUp.revision ? "مسجل" : "—",
      tajweed: "—",
      fluency: followUp.recitationRating || "—",
      commitment: followUp.behaviorRating || "—",
    },
    strengths: [],
    improvements: [],
    teacherNote: followUp.teacherNotes || report.generalNotes || "لا توجد ملاحظات",
    recommendations: followUp.homework ? [followUp.homework] : [],
    newMemorization: followUp.newMemorization || null,
    revision: followUp.revision || null,
    attendance: followUp.attendance,
  };
}

exports.getDashboard = catchAsync(async (req, res) => {
  const students = await Student.find({ parent: req.user._id, active: true })
    .populate({
      path: "halaqa",
      select: "name teacher schedule location",
      populate: { path: "teacher", select: "name" },
    })
    .sort("fullName");

  const studentIds = students.map((student) => student._id);
  const followUps = await FollowUp.find({ student: { $in: studentIds } })
    .populate({
      path: "report",
      select: "date generalTopic generalNotes teacher",
      populate: { path: "teacher", select: "name" },
    });

  const now = new Date();
  const children = students.map((student) => {
    const records = followUps
      .filter((item) => String(item.student) === String(student._id) && item.report)
      .sort((a, b) => new Date(b.report.date) - new Date(a.report.date));
    const latest = records[0] || null;
    const recitationsThisMonth = records.filter((item) => {
      const date = new Date(item.report.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return {
      id: student._id,
      name: student.fullName,
      age: student.age,
      gender: student.gender,
      circle: student.halaqa?.name || "غير محدد",
      teacher: student.halaqa?.teacher?.name || "غير محدد",
      level: "غير محدد",
      activity: student.active ? "active" : "inactive",
      overview: {
        progress: latest ? {
          currentMemorization: latest.newMemorization || null,
          revision: latest.revision || null,
          recitationsThisMonth,
          lastRating: latest.recitationRating || null,
        } : null,
        attendance: summarizeAttendance(records),
        lastAchievement: null,
        lastReport: formatReport(latest),
        upcoming: [],
        announcements: [],
        payments: null,
      },
    };
  });

  res.json({
    success: true,
    data: {
      parent: {
        id: req.user._id,
        name: req.user.name,
        phone: req.user.phone,
      },
      children,
      notifications: [],
    },
  });
});
