// ============================================
// Student Controller
// Handles student-specific operations:
// - View their own attendance records
// ============================================

const Attendance = require("../models/Attendance");

/**
 * GET /api/student/attendance
 * View the logged-in student's attendance records
 *
 * Optional query params:
 * - month: Filter by month (1-12)
 * - year: Filter by year (e.g., 2026)
 *
 * The student can only see their OWN records (enforced by using req.user._id)
 */
const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { month, year } = req.query;

    // Build the query filter — always filter by this student
    const filter = { student: studentId };

    // If month and year are provided, filter by date range
    // Date is stored as "YYYY-MM-DD" string, so we use regex matching
    if (month && year) {
      // Pad month to 2 digits (e.g., "3" becomes "03")
      const paddedMonth = month.toString().padStart(2, "0");
      // Match dates like "2026-04-XX"
      filter.date = { $regex: `^${year}-${paddedMonth}` };
    } else if (year) {
      // Match all dates in a given year
      filter.date = { $regex: `^${year}` };
    }

    // Fetch records with teacher info populated
    const records = await Attendance.find(filter)
      .populate("teacher", "name subject")
      .sort({ date: -1 });

    // Calculate attendance summary
    const totalClasses = records.length;
    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;
    const attendancePercentage =
      totalClasses > 0
        ? ((presentCount / totalClasses) * 100).toFixed(1)
        : "0.0";

    res.status(200).json({
      success: true,
      count: totalClasses,
      data: {
        records,
        summary: {
          totalClasses,
          present: presentCount,
          absent: absentCount,
          percentage: attendancePercentage,
        },
      },
    });
  } catch (error) {
    console.error("Get my attendance error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records.",
    });
  }
};

module.exports = { getMyAttendance };
