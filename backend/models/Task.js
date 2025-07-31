const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [3, "Task title must be at least 3 characters long"],
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Task description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["todo", "inprogress", "review", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Task must belong to a project"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task creator is required"],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    estimatedHours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative"],
      max: [1000, "Estimated hours cannot exceed 1000"],
      default: null,
    },
    actualHours: {
      type: Number,
      min: [0, "Actual hours cannot be negative"],
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [20, "Tag cannot exceed 20 characters"],
      },
    ],
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        mimetype: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    position: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ project: 1, status: 1 });

// Pre-save middleware to set completedAt when status changes to 'done'
taskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "done" && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== "done") {
      this.completedAt = null;
    }
  }
  next();
});

// Method to check if task is overdue
taskSchema.methods.isOverdue = function () {
  if (!this.dueDate || this.status === "done") return false;
  return new Date() > this.dueDate;
};

// Method to calculate progress percentage
taskSchema.methods.getProgress = function () {
  const statusProgress = {
    todo: 0,
    inprogress: 50,
    review: 75,
    done: 100,
  };
  return statusProgress[this.status] || 0;
};

// Static method to get tasks by project with filters
taskSchema.statics.findByProject = function (projectId, filters = {}) {
  const query = { project: projectId };

  if (filters.status) query.status = filters.status;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.priority) query.priority = filters.priority;
  if (filters.dueDate) {
    query.dueDate = { $lte: new Date(filters.dueDate) };
  }

  return this.find(query)
    .populate("assignedTo", "username email fullName avatar")
    .populate("createdBy", "username email fullName avatar")
    .populate("comments.user", "username fullName avatar")
    .sort({ position: 1, createdAt: -1 });
};

// Static method to get task statistics for a project
taskSchema.statics.getProjectStats = function (projectId) {
  return this.aggregate([
    { $match: { project: mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgEstimatedHours: { $avg: "$estimatedHours" },
        totalActualHours: { $sum: "$actualHours" },
      },
    },
  ]);
};

module.exports = mongoose.model("Task", taskSchema);
