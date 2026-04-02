// ============================================
// Auth Routes
// Public routes for signup and login
// Protected route for getting current user
// ============================================

const express = require("express");
const { body } = require("express-validator");
const { signup, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/signup
 * Public — allows students to create an account
 * Validates: name (2+ chars), email (valid format), password (6+ chars)
 */
router.post(
  "/signup",
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
  signup
);

/**
 * POST /api/auth/login
 * Public — allows any user to log in
 * Validates: email (required), password (required)
 */
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

/**
 * GET /api/auth/me
 * Protected — requires valid JWT token
 * Returns the currently logged-in user's profile
 */
router.get("/me", protect, getMe);

module.exports = router;
