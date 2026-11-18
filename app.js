const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const halaqaRoutes = require("./routes/halaqaRoutes");
const reportRoutes = require("./routes/reportRoutes");
const parentRoutes = require("./routes/parentRoutes");
const { notFound, globalError } = require("./middlewares/errorMiddleware");

const app = express();
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"].filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin not allowed by CORS"));
  },
}));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ success: true, message: "Waed API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/halaqas", halaqaRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/parent", parentRoutes);
app.use(notFound);
app.use(globalError);

module.exports = app;
