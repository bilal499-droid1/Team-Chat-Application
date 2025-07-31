const express = require("express");
const { body } = require("express-validator");
const {
  getMessagesByProject,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  markAsRead,
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
  body("replyTo")
    .optional()
    .isMongoId()
    .withMessage("Valid reply message ID is required"),
];

const editMessageValidation = [
  body("content")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message content must be between 1 and 1000 characters")
    .trim(),
];

const reactionValidation = [
  body("emoji")
    .isLength({ min: 1, max: 10 })
    .withMessage("Emoji is required")
    .trim(),
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

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put("/:id", editMessageValidation, validateRequest, editMessage);

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete("/:id", deleteMessage);

// @route   POST /api/messages/:id/reactions
// @desc    Add reaction to message
// @access  Private
router.post("/:id/reactions", reactionValidation, validateRequest, addReaction);

// @route   DELETE /api/messages/:id/reactions
// @desc    Remove reaction from message
// @access  Private
router.delete(
  "/:id/reactions",
  reactionValidation,
  validateRequest,
  removeReaction
);

// @route   POST /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.post("/:id/read", markAsRead);

module.exports = router;
