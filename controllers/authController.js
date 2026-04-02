// ============================================
// Auth Controller
// Handles user registration (signup) and login
// ============================================

const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

/**
 * generateToken - Creates a JWT token for a given user ID
 * The token expires in 7 days. You can change this as needed.
 *
 * @param {string} id - The MongoDB _id of the user
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

/**
 * POST /api/auth/signup
 * Register a new STUDENT account
 *
 * Only students can sign up on their own.
 * Admins and teachers are created by the admin.
 *
 * Request body: { name, email, password }
 */
const signup = async (req, res) => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // Create the new student user
    // Role is hardcoded to "student" — users cannot assign themselves admin/teacher roles
    const user = await User.create({
      name,
      email,
      password,
      role: "student",
    });

    // Generate a JWT token for immediate login after signup
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Student account created successfully!",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during signup. Please try again.",
    });
  }
};

/**
 * POST /api/auth/login
 * Log in an existing user (any role)
 *
 * Request body: { email, password }
 * Returns: user data + JWT token
 */
const login = async (req, res) => {
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

    const { email, password } = req.body;

    // Find the user by email (we need to include password for comparison)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare the provided password with the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate token and return user data
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful!",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during login. Please try again.",
    });
  }
};

/**
 * GET /api/auth/me
 * Get the currently logged-in user's profile
 * Requires: valid JWT token in Authorization header
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by the 'protect' middleware
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    console.error("GetMe error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

module.exports = { signup, login, getMe };
