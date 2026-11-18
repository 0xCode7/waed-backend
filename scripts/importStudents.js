require("dotenv").config({ path: "config/.env" });

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const readXlsxFile = require("read-excel-file/node");
const { dbConnection } = require("../config/db");
const User = require("../models/userModel");
const Student = require("../models/studentModel");

const DEFAULT_FILE = path.join(__dirname, "../data/حلقات مركز واعد.xlsx");
const SHOULD_IMPORT = process.argv.includes("--import");

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

function convertDigits(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => arabicDigits.indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => persianDigits.indexOf(digit));
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();
}

function normalizePhone(value) {
  let phone = convertDigits(value);
  if (/^\d+\.0$/.test(phone)) phone = phone.slice(0, -2);
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("0020")) phone = `0${phone.slice(4)}`;
  else if (phone.startsWith("20")) phone = `0${phone.slice(2)}`;
  if (phone.startsWith("1") && phone.length === 10) phone = `0${phone}`;
  return phone;
}

function isEgyptianPhone(phone) {
  const mobile = /^01[0125]\d{8}$/;
  const landline = /^0(?:2\d{8}|[3-9]\d{7,8})$/;
  return mobile.test(phone) || landline.test(phone);
}

function parseAge(value) {
  if (typeof value === "number") return Math.trunc(value);
  const text = convertDigits(value).trim();
  const number = text.match(/\d{1,2}/)?.[0];
  if (number) return Number(number);

  const words = [
    ["عشر", 10], ["تسع", 9], ["ثمان", 8], ["ثمن", 8],
    ["سبع", 7], ["ست", 6], ["خمس", 5], ["اربع", 4],
  ];
  const normalized = normalizeKey(text);
  return words.find(([word]) => normalized.includes(word))?.[1] ?? null;
}

function normalizeGender(value) {
  const gender = normalizeKey(value);
  if (gender === "ذكر") return "male";
  if (gender === "انثي") return "female";
  return null;
}

function parentNameFromStudent(studentName) {
  const parts = cleanText(studentName).split(" ");
  return parts.length >= 3 ? parts.slice(1).join(" ") : `ولي أمر ${studentName}`;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function csvValue(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function readStudents(filePath) {
  const workbook = await readXlsxFile(filePath);
  const rows = workbook[0]?.data || workbook;
  const headers = rows[0].map(cleanText);
  const columns = {
    name: headers.indexOf("الإسم رباعي"),
    age: headers.indexOf("السن"),
    gender: headers.indexOf("النوع"),
    phone: headers.indexOf("رقم التواصل (واتساب ولي الأمر)"),
  };

  if (Object.values(columns).some((index) => index === -1)) {
    throw new Error("أحد الأعمدة المطلوبة غير موجود في ملف Excel");
  }

  const accepted = [];
  const rejected = [];
  const seen = new Map();

  // تصحيحات مؤكدة للصفوف غير المنتظمة في ملف التسجيل الحالي.
  const rowCorrections = {
    25: [
      { fullName: "مروان أحمد عبده السيد", age: 12, gender: "male" },
      { fullName: "جنى أحمد عبده السيد", age: 9, gender: "female" },
    ],
    48: [{ fullName: "محمد علاء جمعه محمد السيد", age: 7, gender: "male" }],
    58: [{ fullName: "كريم شعبان", age: 10, gender: "male", allowShortName: true }],
  };

  rows.slice(1).forEach((row, index) => {
    const excelRow = index + 2;
    const phone = normalizePhone(row[columns.phone]);
    const entries = rowCorrections[excelRow] || [{
      fullName: cleanText(row[columns.name]),
      age: parseAge(row[columns.age]),
      gender: normalizeGender(row[columns.gender]),
    }];

    entries.forEach((entry) => {
      const { fullName, age, gender, allowShortName = false } = entry;
      const nameParts = fullName.split(" ").filter(Boolean);
      const errors = [];

      if ((!allowShortName && nameParts.length < 3) || nameParts.length > 6) {
        errors.push("اسم الطالب يحتاج مراجعة");
      }
      if (!age || age < 3 || age > 100) errors.push("السن غير صحيح");
      if (!gender) errors.push("النوع غير صحيح");
      if (!isEgyptianPhone(phone)) errors.push("رقم ولي الأمر غير صحيح");

      const uniqueKey = `${normalizeKey(fullName)}|${phone}`;
      const previousIndex = seen.get(uniqueKey);
      if (previousIndex !== undefined) {
        // لو التسجيل الأحدث صحح السن، نحتفظ بأحدث قيمة دون تكرار الطالب.
        accepted[previousIndex].age = age;
        errors.push("تسجيل مكرر داخل الملف؛ تم الاحتفاظ بأحدث سن");
      }

      if (errors.length) {
        rejected.push({ row: excelRow, fullName, phone, reason: errors.join("، ") });
        return;
      }

      seen.set(uniqueKey, accepted.length);
      accepted.push({ fullName, age, gender, phone, parentName: parentNameFromStudent(fullName) });
    });
  });

  return { accepted, rejected };
}

async function importStudents(students) {
  const credentials = [];
  let parentsCreated = 0;
  let studentsCreated = 0;
  let studentsUpdated = 0;
  let studentsAlreadyExist = 0;

  for (const item of students) {
    let parent = await User.findOne({ phone: item.phone });

    if (parent && parent.role !== "parent") {
      throw new Error(`الرقم ${item.phone} مستخدم في حساب ${parent.role}`);
    }

    if (!parent) {
      const temporaryPassword = generateTemporaryPassword();
      parent = await User.create({
        name: item.parentName,
        phone: item.phone,
        password: temporaryPassword,
        role: "parent",
        mustChangePassword: true,
      });
      credentials.push({ name: parent.name, phone: parent.phone, temporaryPassword });
      parentsCreated += 1;
    }

    const existingStudent = await Student.findOne({ fullName: item.fullName, parent: parent._id });
    if (existingStudent) {
      if (existingStudent.age !== item.age || existingStudent.gender !== item.gender) {
        existingStudent.age = item.age;
        existingStudent.gender = item.gender;
        await existingStudent.save();
        studentsUpdated += 1;
      } else {
        studentsAlreadyExist += 1;
      }
      continue;
    }

    await Student.create({
      fullName: item.fullName,
      age: item.age,
      gender: item.gender,
      parent: parent._id,
    });
    studentsCreated += 1;
  }

  return { credentials, parentsCreated, studentsCreated, studentsUpdated, studentsAlreadyExist };
}

function saveCredentials(credentials) {
  if (!credentials.length) return null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(__dirname, `../data/parent-credentials-${timestamp}.csv`);
  const lines = ["Parent Name,Phone,Temporary Password"];
  credentials.forEach((item) => {
    lines.push([item.name, item.phone, item.temporaryPassword].map(csvValue).join(","));
  });
  fs.writeFileSync(filePath, `\uFEFF${lines.join("\n")}`, { mode: 0o600 });
  return filePath;
}

async function main() {
  const fileArgument = process.argv.find((argument) => argument.startsWith("--file="));
  const filePath = fileArgument ? path.resolve(fileArgument.slice(7)) : DEFAULT_FILE;
  if (!fs.existsSync(filePath)) throw new Error(`ملف Excel غير موجود: ${filePath}`);

  const { accepted, rejected } = await readStudents(filePath);
  const uniqueParents = new Set(accepted.map((student) => student.phone)).size;

  console.log(`Valid students: ${accepted.length}`);
  console.log(`Unique parents: ${uniqueParents}`);
  console.log(`Rejected rows: ${rejected.length}`);
  rejected.forEach((item) => console.log(`Row ${item.row}: ${item.fullName} - ${item.reason}`));

  if (!SHOULD_IMPORT) {
    console.log("Dry run only. Add --import to save data.");
    return;
  }

  await dbConnection();
  const result = await importStudents(accepted);
  const credentialsPath = saveCredentials(result.credentials);
  console.log(`Parents created: ${result.parentsCreated}`);
  console.log(`Students created: ${result.studentsCreated}`);
  console.log(`Students updated: ${result.studentsUpdated}`);
  console.log(`Students already exist: ${result.studentsAlreadyExist}`);
  if (credentialsPath) console.log(`Credentials saved securely to: ${credentialsPath}`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = {
  convertDigits,
  normalizePhone,
  isEgyptianPhone,
  parseAge,
  normalizeGender,
};
