const mongoose = require("mongoose");
exports.dbConnection = () => {
  return mongoose.connect(process.env.DATABASE, {
    dbName: process.env.DATABASE_NAME || "waed",
  }).then(() => {
    console.log("Database Connected!");
  });
};
