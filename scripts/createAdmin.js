require("dotenv").config({ path: "config/.env" });
const mongoose = require("mongoose");
const { dbConnection } = require("../config/db");
const User = require("../models/userModel");

async function createAdmin() {
  const [name, phone, password] = process.argv.slice(2);
  if (!name || !phone || !password) {
    console.log('Usage: node scripts/createAdmin.js "Admin Name" 01000000000 password');
    process.exitCode = 1;
    return;
  }

  await dbConnection();
  const existing = await User.findOne({ phone });
  if (existing) throw new Error("هذا الرقم مسجل بالفعل");
  await User.create({ name, phone, password, role: "admin" });
  console.log("Admin created successfully");
}

createAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
