// ============================================
// Authentication & Authorization Middleware
// Verifies JWT tokens and checks user roles
// ============================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect - Middleware that verifies the JWT token
 *
 * How it works:
 * 1. Reads the "Authorization" header from the request
 * 2. Extracts the token (format: "Bearer <token>")
 * 3. Verifies the token using the JWT_SECRET
 * 4. Finds the user in the database and attaches it to req.user
 * 5. If anything fails, returns a 401 Unauthorized response
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if the Authorization header exists and starts with "Bearer"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract the token part (after "Bearer ")
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token was found, the user is not authenticated
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in.",
      });
    }

    // Verify the token - this will throw an error if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by the ID stored in the token, excluding the password field
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    // Attach the user object to the request so downstream handlers can access it
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized. Token is invalid or expired.",
    });
  }
};

/**
 * authorize - Middleware factory that restricts access to specific roles
 *
 * Usage: authorize("admin", "teacher") — only admin and teacher can access
 *
 * @param  {...string} roles - The allowed roles
 * @returns Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the 'protect' middleware above
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in first.",
      });
    }

    // Check if the user's role is in the list of allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
