const express = require("express");
const { body } = require("express-validator");
const {
  getMessagesByProject,
  sendMessage,
  getUnreadCount,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validation");

const router = express.Router();

// Validation rules
const sendMessageValidation = [
  body("content")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message content must be between 1 and 1000 characters")
    .trim(),
  body("project").isMongoId().withMessage("Valid project ID is required"),
  body("messageType")
    .optional()
    .isIn(["text", "image", "file", "system"])
    .withMessage("Invalid message type"),
];

// All routes require authentication
router.use(protect);

// @route   GET /api/messages/project/:projectId
// @desc    Get messages for a project
// @access  Private
router.get("/project/:projectId", getMessagesByProject);

// @route   GET /api/messages/unread/:projectId
// @desc    Get unread message count for project
// @access  Private
router.get("/unread/:projectId", getUnreadCount);

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post("/", sendMessageValidation, validateRequest, sendMessage);

module.exports = router;
