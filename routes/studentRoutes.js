// ============================================
// Student Routes
// All routes require: authentication + student role
// ============================================

const express = require("express");
const { getMyAttendance } = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes below require authentication AND student role
router.use(protect);
router.use(authorize("student"));

/**
 * GET /api/student/attendance
 * Get the logged-in student's attendance records
 * Optional query params: ?month=4&year=2026
 */
router.get("/attendance", getMyAttendance);

module.exports = router;
