// ============================================
// Teacher Routes
// All routes require: authentication + teacher role
// ============================================

const express = require("express");
const { body } = require("express-validator");
const {
  getStudents,
  markAttendance,
  getAttendance,
} = require("../controllers/teacherController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes below require authentication AND teacher role
router.use(protect);
router.use(authorize("teacher"));

/**
 * GET /api/teacher/students
 * Get all students (for the attendance form)
 */
router.get("/students", getStudents);

/**
 * POST /api/teacher/attendance
 * Mark attendance for students
 * Validates: date format and records array
 */
router.post(
  "/attendance",
  [
    body("date")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Date must be in YYYY-MM-DD format"),
    body("records")
      .isArray({ min: 1 })
      .withMessage("Records must be a non-empty array"),
  ],
  markAttendance
);

/**
 * GET /api/teacher/attendance
 * View attendance records marked by this teacher
 * Optional query: ?date=2026-04-02
 */
router.get("/attendance", getAttendance);

module.exports = router;
