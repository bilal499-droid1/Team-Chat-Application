const { body, param, query, validationResult } = require("express-validator");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

// User validation rules
const validateUserRegistration = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("fullName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Full name cannot exceed 50 characters"),

  handleValidationErrors,
];

const validateUserLogin = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Project validation rules
const validateProject = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Project name must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Project description cannot exceed 500 characters"),

  body("status")
    .optional()
    .isIn(["planning", "active", "completed", "archived"])
    .withMessage("Invalid project status"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid project priority"),

  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Color must be a valid hex color code"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Each tag cannot exceed 20 characters"),

  handleValidationErrors,
];

// Task validation rules
const validateTask = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Task title must be between 3 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Task description cannot exceed 1000 characters"),

  body("status")
    .optional()
    .isIn(["todo", "inprogress", "review", "done"])
    .withMessage("Invalid task status"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid task priority"),

  body("project").isMongoId().withMessage("Valid project ID is required"),

  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Assigned user must be a valid user ID"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),

  body("estimatedHours")
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage("Estimated hours must be between 0 and 1000"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Each tag cannot exceed 20 characters"),

  handleValidationErrors,
];

// Message validation rules
const validateMessage = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message content must be between 1 and 1000 characters"),

  body("project").isMongoId().withMessage("Valid project ID is required"),

  body("messageType")
    .optional()
    .isIn(["text", "image", "file", "system"])
    .withMessage("Invalid message type"),

  body("replyTo")
    .optional()
    .isMongoId()
    .withMessage("Reply to must be a valid message ID"),

  handleValidationErrors,
];

// Parameter validation rules
const validateObjectId = (paramName = "id") => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),

  handleValidationErrors,
];

// Query validation rules
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

const validateTaskFilters = [
  query("status")
    .optional()
    .isIn(["todo", "inprogress", "review", "done"])
    .withMessage("Invalid task status filter"),

  query("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Invalid task priority filter"),

  query("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Assigned to filter must be a valid user ID"),

  query("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date filter must be a valid date"),

  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProject,
  validateTask,
  validateMessage,
  validateObjectId,
  validatePagination,
  validateTaskFilters,
};
