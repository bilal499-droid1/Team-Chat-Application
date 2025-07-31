const Task = require("../models/Task");
const Project = require("../models/Project");
const mongoose = require("mongoose");
const { getPagination } = require("../utils/helpers");

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private (Project members only)
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assignedTo, priority, dueDate, search, page, limit } =
      req.query;

    // Build filter object
    const filters = { project: projectId };
    if (status) filters.status = status;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (priority) filters.priority = priority;
    if (dueDate) filters.dueDate = { $lte: new Date(dueDate) };

    // Handle search
    let query = Task.find(filters);
    if (search) {
      query = query.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Get pagination
    const pagination = getPagination(page, limit);

    // Execute query with population
    const tasks = await query
      .populate("assignedTo", "username email fullName avatar")
      .populate("createdBy", "username email fullName avatar")
      .populate("comments.user", "username fullName avatar")
      .sort({ position: 1, createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    // Get total count for pagination
    const total = await Task.countDocuments(filters);

    res.json({
      success: true,
      count: tasks.length,
      total,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
      data: {
        tasks,
      },
    });
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching tasks",
    });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private (Project members only)
const getTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId)
      .populate("project", "name")
      .populate("assignedTo", "username email fullName avatar")
      .populate("createdBy", "username email fullName avatar")
      .populate("comments.user", "username fullName avatar")
      .populate("attachments.uploadedBy", "username fullName");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      data: {
        task,
      },
    });
  } catch (error) {
    console.error("Get Task Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error fetching task",
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Project members only)
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      project,
      assignedTo,
      dueDate,
      estimatedHours,
      tags,
    } = req.body;

    const userId = req.user._id;

    // Get the highest position for the status column
    const lastTask = await Task.findOne({
      project,
      status: status || "todo",
    }).sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    const taskData = {
      title,
      description,
      status: status || "todo",
      priority: priority || "medium",
      project,
      assignedTo: assignedTo || null,
      createdBy: userId,
      dueDate: dueDate || null,
      estimatedHours: estimatedHours || null,
      tags: tags || [],
      position,
    };

    const task = new Task(taskData);
    await task.save();

    // Populate the created task
    await task.populate("project", "name");
    await task.populate("assignedTo", "username email fullName avatar");
    await task.populate("createdBy", "username email fullName avatar");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    console.error("Create Task Error:", error);

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
      message: "Server error creating task",
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Project members only)
const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      estimatedHours,
      actualHours,
      tags,
    } = req.body;

    // Get current task
    const currentTask = await Task.findById(taskId);
    if (!currentTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (estimatedHours !== undefined)
      updateData.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (tags !== undefined) updateData.tags = tags;

    // Handle status change (may require position update)
    if (status !== undefined && status !== currentTask.status) {
      // Get the highest position for the new status column
      const lastTask = await Task.findOne({
        project: currentTask.project,
        status: status,
      }).sort({ position: -1 });

      updateData.status = status;
      updateData.position = lastTask ? lastTask.position + 1 : 0;
    }

    const task = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("project", "name")
      .populate("assignedTo", "username email fullName avatar")
      .populate("createdBy", "username email fullName avatar")
      .populate("comments.user", "username fullName avatar");

    res.json({
      success: true,
      message: "Task updated successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    console.error("Update Task Error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error updating task",
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Project members only)
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Only task creator or assigned user can delete the task
    const userId = req.user._id.toString();
    const canDelete =
      task.createdBy.toString() === userId ||
      (task.assignedTo && task.assignedTo.toString() === userId);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only delete tasks you created or are assigned to.",
      });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete Task Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error deleting task",
    });
  }
};

// @desc    Update task positions (for drag and drop)
// @route   PUT /api/tasks/reorder
// @access  Private (Project members only)
const reorderTasks = async (req, res) => {
  try {
    const { taskId, newStatus, newPosition, projectId } = req.body;

    if (!taskId || !newStatus || newPosition === undefined || !projectId) {
      return res.status(400).json({
        success: false,
        message: "taskId, newStatus, newPosition, and projectId are required",
      });
    }

    // Get the task to be moved
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const oldStatus = task.status;
    const oldPosition = task.position;

    // If moving to a different status column
    if (oldStatus !== newStatus) {
      // Update positions in the old column (move tasks up)
      await Task.updateMany(
        {
          project: projectId,
          status: oldStatus,
          position: { $gt: oldPosition },
        },
        { $inc: { position: -1 } }
      );

      // Update positions in the new column (make space)
      await Task.updateMany(
        {
          project: projectId,
          status: newStatus,
          position: { $gte: newPosition },
        },
        { $inc: { position: 1 } }
      );
    } else {
      // Moving within the same column
      if (newPosition < oldPosition) {
        // Moving up - shift tasks down
        await Task.updateMany(
          {
            project: projectId,
            status: newStatus,
            position: { $gte: newPosition, $lt: oldPosition },
          },
          { $inc: { position: 1 } }
        );
      } else if (newPosition > oldPosition) {
        // Moving down - shift tasks up
        await Task.updateMany(
          {
            project: projectId,
            status: newStatus,
            position: { $gt: oldPosition, $lte: newPosition },
          },
          { $inc: { position: -1 } }
        );
      }
    }

    // Update the moved task
    task.status = newStatus;
    task.position = newPosition;
    await task.save();

    // Return updated task
    await task.populate("assignedTo", "username email fullName avatar");
    await task.populate("createdBy", "username email fullName avatar");

    res.json({
      success: true,
      message: "Task position updated successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    console.error("Reorder Tasks Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error reordering tasks",
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private (Project members only)
const addComment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Add comment
    task.comments.push({
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
    });

    await task.save();
    await task.populate("comments.user", "username fullName avatar");

    // Get the newly added comment
    const newComment = task.comments[task.comments.length - 1];

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comment: newComment,
      },
    });
  } catch (error) {
    console.error("Add Comment Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error adding comment",
    });
  }
};

// @desc    Get task statistics for a project
// @route   GET /api/tasks/stats/:projectId
// @access  Private (Project members only)
const getTaskStats = async (req, res) => {
  try {
    const { projectId } = req.params;

    const stats = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgEstimatedHours: { $avg: "$estimatedHours" },
          totalActualHours: { $sum: "$actualHours" },
        },
      },
    ]);

    // Get overdue tasks count
    const overdueCount = await Task.countDocuments({
      project: projectId,
      dueDate: { $lt: new Date() },
      status: { $ne: "done" },
    });

    // Get total task count
    const totalTasks = await Task.countDocuments({ project: projectId });

    res.json({
      success: true,
      data: {
        stats,
        totalTasks,
        overdueCount,
      },
    });
  } catch (error) {
    console.error("Get Task Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching task statistics",
    });
  }
};

module.exports = {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addComment,
  getTaskStats,
};
