const mongoose = require("mongoose");
exports.dbConnection = () => {
  return mongoose.connect(process.env.DATABASE).then(() => {
    console.log("Database Connected!");
  });
};
