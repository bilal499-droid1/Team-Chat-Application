const Message = require("../models/Message");
const User = require("../models/User");
const Project = require("../models/Project");

// @desc    Get messages for a project
// @route   GET /api/messages/:projectId
// @access  Private (Project members only)
const getMessagesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const messages = await Message.find({ project: projectId })
      .populate("sender", "username fullName avatar")
      .sort({ createdAt: -1 })
      .limit(limitNum * 1)
      .skip((pageNum - 1) * limitNum);

    const totalMessages = await Message.countDocuments({ project: projectId });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        totalMessages,
        currentPage: pageNum,
        totalPages: Math.ceil(totalMessages / limitNum),
      },
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving messages",
    });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private (Project members only)
const sendMessage = async (req, res) => {
  try {
    const { content, project, messageType, attachment } = req.body;
    const userId = req.user._id;

    const messageData = {
      content,
      sender: userId,
      project,
      messageType: messageType || "text",
    };

    // Add attachment data if provided
    if (attachment) {
      messageData.attachment = attachment;
    }

    const message = new Message(messageData);
    await message.save();

    // Populate the created message
    await message.populate("sender", "username fullName avatar");

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

// @desc    Get unread message count for user
// @route   GET /api/messages/unread/:userId
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    // For simplified system, we can return 0 or implement basic counting
    const unreadCount = 0;

    res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get Unread Count Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting unread count",
    });
  }
};

module.exports = {
  getMessagesByProject,
  sendMessage,
  getUnreadCount,
};
