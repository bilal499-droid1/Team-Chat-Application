const express = require("express");
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
} = require("../controllers/authController");

// Import middleware
const { authMiddleware } = require("../middleware/auth");
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors,
} = require("../middleware/validation");
const { body } = require("express-validator");

// Public routes
// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", validateUserRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateUserLogin, login);

// Protected routes (require authentication)
// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", authMiddleware, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    authMiddleware,
    body("fullName")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Full name cannot exceed 50 characters"),
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be between 3 and 20 characters")
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage(
        "Username can only contain letters, numbers, underscores, and hyphens"
      ),
    handleValidationErrors,
  ],
  updateProfile
);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put(
  "/password",
  [
    authMiddleware,
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "New password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
    handleValidationErrors,
  ],
  changePassword
);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post("/refresh", authMiddleware, refreshToken);

module.exports = router;
