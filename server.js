// ============================================
// School Management System - Main Server File
// ============================================
// This is the entry point for the application.
// It sets up Express, connects to MongoDB, mounts
// all routes, and starts listening for requests.
// ============================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");

// Load environment variables from .env file
// This MUST be called before accessing process.env values
dotenv.config();

// Import route files
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");

// Create Express application
const app = express();

// ============================================
// Middleware Setup
// ============================================

// helmet: Sets various HTTP headers for security (XSS protection, etc.)
app.use(helmet());

// cors: Allows the frontend (running on a different port) to make API calls
// In production, you'd restrict the origin to your frontend domain
app.use(
  cors({
    origin: "*", // Allow all origins (for development)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ============================================
// API Routes
// ============================================

// Health check endpoint — useful for monitoring
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "School Management System API is running!",
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules on their respective base paths
app.use("/api/auth", authRoutes);       // /api/auth/signup, /api/auth/login, /api/auth/me
app.use("/api/admin", adminRoutes);     // /api/admin/students, /api/admin/teachers, etc.
app.use("/api/teacher", teacherRoutes); // /api/teacher/attendance, /api/teacher/students
app.use("/api/student", studentRoutes); // /api/student/attendance

// ============================================
// 404 Handler — Catch unmatched routes
// ============================================
app.use("/{*splat}", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ============================================
// Global Error Handler
// ============================================
// This catches any errors thrown in route handlers
// Express identifies error handlers by having 4 parameters
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ============================================
// Seed Admin Account
// ============================================
/**
 * seedAdmin - Creates the default admin account if one doesn't exist
 * Runs once on server startup.
 * Uses credentials from environment variables.
 */
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      await User.create({
        name: process.env.ADMIN_NAME || "Admin",
        email: process.env.ADMIN_EMAIL || "admin@school.com",
        password: process.env.ADMIN_PASSWORD || "admin123",
        role: "admin",
      });
      console.log("Default admin account created successfully!");
      console.log(`  Email: ${process.env.ADMIN_EMAIL || "admin@school.com"}`);
      console.log(`  Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
    } else {
      console.log("Admin account already exists. Skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding admin:", error.message);
  }
};

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start listening
connectDB().then(() => {
  // Seed the admin account after DB connection
  seedAdmin();

  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  School Management System API`);
    console.log(`  Running on: http://localhost:${PORT}`);
    console.log(`  Health:     http://localhost:${PORT}/api/health`);
    console.log(`========================================\n`);
  });
});
