// ============================================
// Teacher Controller
// Handles teacher-specific operations:
// - Mark attendance for students
// - View attendance records they've marked
// ============================================

const { validationResult } = require("express-validator");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

/**
 * GET /api/teacher/students
 * Get all students (so the teacher can mark their attendance)
 */
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("_id name email")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: { students },
    });
  } catch (error) {
    console.error("Get students error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students.",
    });
  }
};

/**
 * POST /api/teacher/attendance
 * Mark attendance for multiple students at once
 *
 * Request body: {
 *   date: "2026-04-02",
 *   records: [
 *     { studentId: "...", status: "present" },
 *     { studentId: "...", status: "absent" }
 *   ]
 * }
 *
 * This uses bulkWrite with upsert to either create or update attendance records.
 * If a record already exists for a student on that date, it gets updated.
 */
const markAttendance = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { date, records } = req.body;
    const teacherId = req.user._id;

    // Validate that records is a non-empty array
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one attendance record.",
      });
    }

    // Validate each record has required fields
    for (const record of records) {
      if (!record.studentId || !record.status) {
        return res.status(400).json({
          success: false,
          message: "Each record must have studentId and status (present/absent).",
        });
      }
      if (!["present", "absent"].includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'present' or 'absent'.",
        });
      }
    }

    // Use bulkWrite for efficient batch operations
    // upsert: true means "update if exists, create if not"
    const operations = records.map((record) => ({
      updateOne: {
        filter: { student: record.studentId, date: date },
        update: {
          $set: {
            student: record.studentId,
            teacher: teacherId,
            date: date,
            status: record.status,
          },
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${records.length} student(s).`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        created: result.upsertedCount,
      },
    });
  } catch (error) {
    console.error("Mark attendance error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance.",
    });
  }
};

/**
 * GET /api/teacher/attendance
 * View all attendance records marked by this teacher
 *
 * Optional query params:
 * - date: Filter by specific date (YYYY-MM-DD)
 */
const getAttendance = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { date } = req.query;

    // Build the query filter
    const filter = { teacher: teacherId };
    if (date) {
      filter.date = date;
    }

    // Populate student details so we can show names instead of just IDs
    const records = await Attendance.find(filter)
      .populate("student", "name email")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: { records },
    });
  } catch (error) {
    console.error("Get attendance error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records.",
    });
  }
};

module.exports = { getStudents, markAttendance, getAttendance };
