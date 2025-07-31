const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Message content is required"],
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
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          maxlength: [10, "Emoji cannot exceed 10 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

// Pre-save middleware to track edit history
messageSchema.pre("save", function (next) {
  if (this.isModified("content") && !this.isNew) {
    this.editHistory.push({
      content: this._original.content,
      editedAt: new Date(),
    });
    this.isEdited = true;
  }
  next();
});

// Pre-findOneAndUpdate middleware to track original content
messageSchema.pre("findOneAndUpdate", async function (next) {
  if (this.getUpdate().content) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      this.getUpdate().$push = {
        editHistory: {
          content: doc.content,
          editedAt: new Date(),
        },
      };
      this.getUpdate().isEdited = true;
    }
  }
  next();
});

// Method to mark message as read by user
messageSchema.methods.markAsRead = function (userId) {
  const existingRead = this.readBy.find(
    (read) => read.user.toString() === userId.toString()
  );

  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date(),
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add reaction
messageSchema.methods.addReaction = function (userId, emoji) {
  const existingReaction = this.reactions.find(
    (reaction) =>
      reaction.user.toString() === userId.toString() && reaction.emoji === emoji
  );

  if (!existingReaction) {
    this.reactions.push({
      user: userId,
      emoji: emoji,
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove reaction
messageSchema.methods.removeReaction = function (userId, emoji) {
  this.reactions = this.reactions.filter(
    (reaction) =>
      !(
        reaction.user.toString() === userId.toString() &&
        reaction.emoji === emoji
      )
  );
  return this.save();
};

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
    .populate("replyTo")
    .populate("reactions.user", "username fullName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get unread message count for user in project
messageSchema.statics.getUnreadCount = function (projectId, userId) {
  return this.countDocuments({
    project: projectId,
    isDeleted: false,
    "readBy.user": { $ne: userId },
  });
};

module.exports = mongoose.model("Message", messageSchema);
