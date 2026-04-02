// ============================================
// Admin Controller
// Handles admin-only operations:
// - View all students and teachers
// - Add new teachers
// - Delete users
// ============================================

const { validationResult } = require("express-validator");
const User = require("../models/User");
const Attendance = require("../models/Attendance");

/**
 * GET /api/admin/students
 * Fetch all users with role "student"
 * Only accessible by admin
 */
const getAllStudents = async (req, res) => {
  try {
    // Find all students, exclude password, sort by newest first
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

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
 * GET /api/admin/teachers
 * Fetch all users with role "teacher"
 * Only accessible by admin
 */
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: { teachers },
    });
  } catch (error) {
    console.error("Get teachers error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers.",
    });
  }
};

/**
 * POST /api/admin/teachers
 * Create a new teacher account
 * Only accessible by admin
 *
 * Request body: { name, email, password, subject }
 */
const addTeacher = async (req, res) => {
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

    const { name, email, password, subject } = req.body;

    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // Create the teacher — role is explicitly set to "teacher"
    const teacher = await User.create({
      name,
      email,
      password,
      role: "teacher",
      subject,
    });

    res.status(201).json({
      success: true,
      message: "Teacher account created successfully!",
      data: { teacher: teacher.toJSON() },
    });
  } catch (error) {
    console.error("Add teacher error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create teacher account.",
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a student or teacher by their ID
 * Only accessible by admin
 *
 * Safety check: Admin cannot delete themselves
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting their own account
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account.",
      });
    }

    // Find the user to delete
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent deleting other admins (safety measure)
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an admin account.",
      });
    }

    // Also delete any attendance records associated with this user
    // If deleting a student, remove their attendance records
    // If deleting a teacher, remove attendance they marked
    if (user.role === "student") {
      await Attendance.deleteMany({ student: id });
    } else if (user.role === "teacher") {
      await Attendance.deleteMany({ teacher: id });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} '${user.name}' deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete user.",
    });
  }
};

module.exports = { getAllStudents, getAllTeachers, addTeacher, deleteUser };
