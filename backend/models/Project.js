const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [3, "Project name must be at least 3 characters long"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Project description cannot exceed 500 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner is required"],
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "admin", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["planning", "active", "completed", "archived"],
      default: "planning",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [20, "Tag cannot exceed 20 characters"],
      },
    ],
    color: {
      type: String,
      default: "#3B82F6", // Default blue color
      match: [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        "Please enter a valid hex color",
      ],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness for non-null values
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
projectSchema.index({ owner: 1 });
projectSchema.index({ "members.user": 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ inviteCode: 1 });

// Pre-save middleware to add owner to members array
projectSchema.pre("save", function (next) {
  // If this is a new project, add owner to members
  if (this.isNew) {
    this.members.push({
      user: this.owner,
      role: "owner",
      joinedAt: new Date(),
    });
  }
  next();
});

// Method to check if user is a member
projectSchema.methods.isMember = function (userId) {
  return this.members.some(
    (member) => member.user.toString() === userId.toString()
  );
};

// Method to get member role
projectSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Method to check if user can edit project
projectSchema.methods.canEdit = function (userId) {
  const role = this.getMemberRole(userId);
  return ["owner", "admin"].includes(role);
};

// Static method to find projects by user
projectSchema.statics.findByUser = function (userId) {
  return this.find({
    $or: [{ owner: userId }, { "members.user": userId }],
  })
    .populate("owner", "username email fullName avatar")
    .populate("members.user", "username email fullName avatar");
};

// Virtual for task count (will be populated when needed)
projectSchema.virtual("taskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "project",
  count: true,
});

module.exports = mongoose.model("Project", projectSchema);
