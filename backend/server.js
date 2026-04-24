const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const busRoutes = require("./routes/bus");

dotenv.config({ path: __dirname + '/.env' });

const app = express();
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const notificationRoutes = require("./routes/notifications");
const attendanceRoutes = require("./routes/attendance");
app.use("/api/auth", authRoutes);
app.use("/api/bus", busRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/attendance", attendanceRoutes);
// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("DB Error:", err);
  });

// Test route
app.get("/", (req, res) => {
  res.send("API is running");
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
