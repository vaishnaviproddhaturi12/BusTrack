const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const busRoutes = require("./routes/bus");

dotenv.config({ path: __dirname + '/.env' });

const app = express();
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
const configuredOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()) : [])
].filter(Boolean);

const allowedHostedDomains = [/\.vercel\.app$/, /\.netlify\.app$/, /\.onrender\.com$/];

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    try {
      const { hostname } = new URL(origin);
      const isAllowedHostedDomain = allowedHostedDomains.some((pattern) => pattern.test(hostname));

      if (configuredOrigins.includes(origin) || isAllowedHostedDomain) {
        return callback(null, true);
      }
    } catch (err) {
      console.error('Invalid CORS origin:', origin);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

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
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
  });

// Test route
app.get("/", (req, res) => {
  res.json({ message: "API is running", status: "OK" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({ 
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🔗 MongoDB: ${MONGO_URI ? 'Configured' : 'Not configured'}`);
});
