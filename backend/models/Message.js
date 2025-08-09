const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: function() {
        // Content is required only if there's no attachment
        return !this.attachment || !this.attachment.filename;
      },
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message sender is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Message must belong to a project"],
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    attachment: {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      path: String,
      url: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
messageSchema.index({ project: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ project: 1, messageType: 1 });

// Static method to get messages by project with pagination
messageSchema.statics.findByProject = function (projectId, options = {}) {
  const {
    page = 1,
    limit = 50,
    messageType = null,
    beforeDate = null,
  } = options;

  const query = {
    project: projectId,
    isDeleted: false,
  };

  if (messageType) query.messageType = messageType;
  if (beforeDate) query.createdAt = { $lt: new Date(beforeDate) };

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate("sender", "username fullName avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get unread message count for user in project
messageSchema.statics.getUnreadCount = function (projectId, userId) {
  return this.countDocuments({
    project: projectId,
    isDeleted: false,
  });
};

module.exports = mongoose.model("Message", messageSchema);
