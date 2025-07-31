const express = require("express");
const router = express.Router();

// Import controllers
const {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addComment,
  getTaskStats,
} = require("../controllers/taskController");

// Import middleware
const {
  authMiddleware,
  projectMemberMiddleware,
} = require("../middleware/auth");
const {
  validateTask,
  validateObjectId,
  validatePagination,
  validateTaskFilters,
  handleValidationErrors,
} = require("../middleware/validation");
const { body } = require("express-validator");

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private (Project members only)
router.get(
  "/project/:projectId",
  [
    validateObjectId("projectId"),
    projectMemberMiddleware,
    validatePagination,
    validateTaskFilters,
  ],
  getTasksByProject
);

// @route   GET /api/tasks/stats/:projectId
// @desc    Get task statistics for a project
// @access  Private (Project members only)
router.get(
  "/stats/:projectId",
  [validateObjectId("projectId"), projectMemberMiddleware],
  getTaskStats
);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private (Project members only)
router.post(
  "/",
  [
    validateTask,
    // Additional middleware to check project membership will be handled in controller
  ],
  createTask
);

// @route   PUT /api/tasks/reorder
// @desc    Update task positions (for drag and drop)
// @access  Private (Project members only)
router.put(
  "/reorder",
  [
    body("taskId").isMongoId().withMessage("Valid task ID is required"),

    body("newStatus")
      .isIn(["todo", "inprogress", "review", "done"])
      .withMessage("Invalid task status"),

    body("newPosition")
      .isInt({ min: 0 })
      .withMessage("Position must be a non-negative integer"),

    body("projectId").isMongoId().withMessage("Valid project ID is required"),

    handleValidationErrors,
  ],
  reorderTasks
);

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Private (Project members only)
router.get(
  "/:id",
  [
    validateObjectId("id"),
    // Project membership will be checked in controller via task.project
  ],
  getTask
);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private (Project members only)
router.put(
  "/:id",
  [
    validateObjectId("id"),
    // Validation for update fields (all optional)
    body("title")
      .optional()
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

    body("actualHours")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Actual hours must be non-negative"),

    body("tags").optional().isArray().withMessage("Tags must be an array"),

    body("tags.*")
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage("Each tag cannot exceed 20 characters"),

    handleValidationErrors,
  ],
  updateTask
);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (Project members only)
router.delete("/:id", [validateObjectId("id")], deleteTask);

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private (Project members only)
router.post(
  "/:id/comments",
  [
    validateObjectId("id"),
    body("text")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Comment text must be between 1 and 500 characters"),

    handleValidationErrors,
  ],
  addComment
);

module.exports = router;
