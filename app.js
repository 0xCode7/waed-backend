const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const halaqaRoutes = require("./routes/halaqaRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { notFound, globalError } = require("./middlewares/errorMiddleware");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ success: true, message: "Waed API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/halaqas", halaqaRoutes);
app.use("/api/reports", reportRoutes);
app.use(notFound);
app.use(globalError);

module.exports = app;
