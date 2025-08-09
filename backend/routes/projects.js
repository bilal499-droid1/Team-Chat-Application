const express = require("express");
const router = express.Router();

// Import controllers
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  joinProject,
  leaveProject,
  inviteToProject,
  updateMemberRole,
  removeMember,
} = require("../controllers/projectController");

// Import middleware
const {
  authMiddleware,
  projectMemberMiddleware,
  projectAdminMiddleware,
} = require("../middleware/auth");
const {
  validateProject,
  validateObjectId,
  validatePagination,
} = require("../middleware/validation");
const { body } = require("express-validator");

// All routes require authentication
router.use(authMiddleware);

// @route   GET /api/projects
// @desc    Get all projects for authenticated user
// @access  Private
router.get("/", validatePagination, getProjects);

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post("/", validateProject, createProject);

// @route   POST /api/projects/join
// @desc    Join project using invite code
// @access  Private
router.post(
  "/join",
  [
    body("inviteCode")
      .trim()
      .notEmpty()
      .withMessage("Invite code is required")
      .isLength({ min: 8, max: 8 })
      .withMessage("Invite code must be 8 characters long"),
  ],
  joinProject
);

// @route   GET /api/projects/:id
// @desc    Get single project by ID
// @access  Private (Project members only)
router.get("/:id", validateObjectId("id"), projectMemberMiddleware, getProject);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Project admin/owner only)
router.put(
  "/:id",
  [
    validateObjectId("id"),
    projectMemberMiddleware,
    projectAdminMiddleware,
    // Validation for update fields (all optional)
    body("name")
      .optional()
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

    body("isPrivate")
      .optional()
      .isBoolean()
      .withMessage("isPrivate must be a boolean value"),
  ],
  updateProject
);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Project owner only)
router.delete("/:id", validateObjectId("id"), deleteProject);

// @route   POST /api/projects/:id/leave
// @desc    Leave project
// @access  Private (Project members only, except owner)
router.post(
  "/:id/leave",
  validateObjectId("id"),
  projectMemberMiddleware,
  leaveProject
);

// @route   POST /api/projects/:id/invite
// @desc    Invite user to project
// @access  Private (All project members can invite)
router.post(
  "/:id/invite",
  [
    validateObjectId("id"),
    projectMemberMiddleware,
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("role")
      .optional()
      .isIn(["member", "admin", "owner"])
      .withMessage("Role must be member, admin, or owner"),
  ],
  inviteToProject
);

// @route   PUT /api/projects/:id/members/:userId/role
// @desc    Update member role
// @access  Private (Owner/Admin only)
router.put(
  "/:id/members/:userId/role",
  [
    validateObjectId("id"),
    validateObjectId("userId"),
    projectMemberMiddleware,
    body("role")
      .isIn(["member", "admin", "owner"])
      .withMessage("Role must be member, admin, or owner"),
  ],
  updateMemberRole
);

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private (Owner/Admin only)
router.delete(
  "/:id/members/:userId",
  [
    validateObjectId("id"),
    validateObjectId("userId"),
    projectMemberMiddleware,
  ],
  removeMember
);

module.exports = router;
