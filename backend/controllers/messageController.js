const Message = require("../models/Message");
const Project = require("../models/Project");
const { getPagination } = require("../utils/helpers");

// @desc    Get messages for a project
// @route   GET /api/messages/project/:projectId
// @access  Private (Project members only)
const getMessagesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page, limit, messageType, beforeDate } = req.query;

    // Get pagination
    const pagination = getPagination(page, limit || 50);

    // Build options for the query
    const options = {
      page: pagination.page,
      limit: pagination.limit,
      messageType,
      beforeDate,
    };

    const messages = await Message.findByProject(projectId, options);
    const total = await Message.countDocuments({
      project: projectId,
      isDeleted: false,
    });

    res.json({
      success: true,
      count: messages.length,
      total,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
      data: {
        messages,
      },
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching messages",
    });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private (Project members only)
const sendMessage = async (req, res) => {
  try {
    const { content, project, messageType, replyTo } = req.body;
    const userId = req.user._id;

    const messageData = {
      content,
      sender: userId,
      project,
      messageType: messageType || "text",
      replyTo: replyTo || null,
    };

    const message = new Message(messageData);
    await message.save();

    // Populate the created message
    await message.populate("sender", "username fullName avatar");
    if (replyTo) {
      await message.populate("replyTo");
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message,
      },
    });
  } catch (error) {
    console.error("Send Message Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error sending message",
    });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:id
// @access  Private (Message sender only)
const editMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only edit your own messages.",
      });
    }

    // Check if message is not too old (e.g., 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (message.createdAt < oneHourAgo) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit messages older than 1 hour",
      });
    }

    // Store original content before updating
    message._original = { content: message.content };
    message.content = content;
    await message.save();

    await message.populate("sender", "username fullName avatar");

    res.json({
      success: true,
      message: "Message updated successfully",
      data: {
        message,
      },
    });
  } catch (error) {
    console.error("Edit Message Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error editing message",
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private (Message sender only)
const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own messages.",
      });
    }

    // Soft delete - mark as deleted
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete Message Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error deleting message",
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:id/reactions
// @access  Private (Project members only)
const addReaction = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "Emoji is required",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await message.addReaction(userId, emoji);
    await message.populate("reactions.user", "username fullName");

    res.json({
      success: true,
      message: "Reaction added successfully",
      data: {
        reactions: message.reactions,
      },
    });
  } catch (error) {
    console.error("Add Reaction Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding reaction",
    });
  }
};

// @desc    Remove reaction from message
// @route   DELETE /api/messages/:id/reactions
// @access  Private (Project members only)
const removeReaction = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await message.removeReaction(userId, emoji);
    await message.populate("reactions.user", "username fullName");

    res.json({
      success: true,
      message: "Reaction removed successfully",
      data: {
        reactions: message.reactions,
      },
    });
  } catch (error) {
    console.error("Remove Reaction Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing reaction",
    });
  }
};

// @desc    Mark message as read
// @route   POST /api/messages/:id/read
// @access  Private (Project members only)
const markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await message.markAsRead(userId);

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark As Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking message as read",
    });
  }
};

// @desc    Get unread message count for project
// @route   GET /api/messages/unread/:projectId
// @access  Private (Project members only)
const getUnreadCount = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const unreadCount = await Message.getUnreadCount(projectId, userId);

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get Unread Count Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching unread count",
    });
  }
};

module.exports = {
  getMessagesByProject,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  markAsRead,
  getUnreadCount,
};
