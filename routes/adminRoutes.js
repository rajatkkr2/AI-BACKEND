// ============================================
// Admin Routes
// All routes require: authentication + admin role
// ============================================

const express = require("express");
const { body } = require("express-validator");
const {
  getAllStudents,
  getAllTeachers,
  addTeacher,
  addStudent,
  deleteUser,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes below require authentication AND admin role
// We apply these middleware to all routes in this router
router.use(protect);
router.use(authorize("admin"));

/**
 * GET /api/admin/students
 * Fetch all students
 */
router.get("/students", getAllStudents);

/**
 * GET /api/admin/teachers
 * Fetch all teachers
 */
router.get("/teachers", getAllTeachers);

/**
 * POST /api/admin/teachers
 * Create a new teacher account
 * Validates: name, email, password, subject
 */
router.post(
  "/teachers",
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("subject")
      .trim()
      .notEmpty()
      .withMessage("Subject is required for teachers"),
  ],
  addTeacher
);

/**
 * POST /api/admin/students
 * Create a new student account
 * Validates: name, email, password
 */
router.post(
  "/students",
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  addStudent
);

/**
 * DELETE /api/admin/users/:id
 * Delete a student or teacher by ID
 */
router.delete("/users/:id", deleteUser);

module.exports = router;
