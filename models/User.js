// ============================================
// User Model
// Stores all users: Admin, Teacher, Student
// ============================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema
 * - name: Full name of the user
 * - email: Unique email used for login
 * - password: Hashed password (never stored in plain text)
 * - role: One of "admin", "teacher", or "student"
 * - subject: Only relevant for teachers (the subject they teach)
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
    },
    subject: {
      type: String,
      trim: true,
      default: null, // Only used for teachers
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

/**
 * Pre-save middleware
 * Automatically hashes the password before saving to the database.
 * Only runs if the password field has been modified (not on every save).
 */
userSchema.pre("save", async function () {
  // Skip hashing if password hasn't changed
  if (!this.isModified("password")) return;

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method: comparePassword
 * Compares a plain-text password with the stored hashed password.
 * Returns true if they match, false otherwise.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Transform toJSON output
 * Removes the password field when converting to JSON (for API responses).
 * This prevents accidentally leaking password hashes.
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
