// ============================================
// Attendance Model
// Tracks daily attendance for each student
// ============================================

const mongoose = require("mongoose");

/**
 * Attendance Schema
 * - student: Reference to the User (student) whose attendance is being recorded
 * - teacher: Reference to the User (teacher) who marked the attendance
 * - date: The date for which attendance is recorded
 * - status: Whether the student was "present" or "absent"
 *
 * The compound index on [student, date] ensures a student can only
 * have ONE attendance record per day (no duplicates).
 */
const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher reference is required"],
    },
    date: {
      type: String, // Stored as "YYYY-MM-DD" for easy comparison
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: [true, "Attendance status is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one attendance record per student per day
// If a teacher tries to mark attendance twice for the same student on the same day,
// MongoDB will reject the duplicate.
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
