const Project = require("../models/Project");
const User = require("../models/User");
const { generateInviteCode } = require("../utils/helpers");

// @desc    Get all projects for the authenticated user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.findByUser(userId).sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      data: {
        projects,
      },
    });
  } catch (error) {
    console.error("Get Projects Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching projects",
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId)
      .populate("owner", "username email fullName avatar")
      .populate("members.user", "username email fullName avatar")
      .populate("taskCount");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user has access to this project
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member of this project.",
      });
    }

    res.json({
      success: true,
      data: {
        project,
      },
    });
  } catch (error) {
    console.error("Get Project Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error fetching project",
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { name, description, status, priority, tags, color, isPrivate } =
      req.body;
    const userId = req.user._id;

    // Create project data
    const projectData = {
      name,
      description,
      owner: userId,
      status: status || "planning",
      priority: priority || "medium",
      tags: tags || [],
      color: color || "#3B82F6",
      isPrivate: isPrivate || false,
    };

    // Generate invite code if not private
    if (!isPrivate) {
      projectData.inviteCode = generateInviteCode();
    }

    const project = new Project(projectData);
    await project.save();

    // Populate the created project
    await project.populate("owner", "username email fullName avatar");
    await project.populate("members.user", "username email fullName avatar");

    // Add project to user's projects array
    await User.findByIdAndUpdate(userId, {
      $push: { projects: project._id },
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    console.error("Create Project Error:", error);

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
      message: "Server error creating project",
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Project Admin/Owner)
const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description, status, priority, tags, color, isPrivate } =
      req.body;

    // Get the current project
    const currentProject = await Project.findById(projectId);
    if (!currentProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check permissions
    if (!currentProject.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You need admin or owner privileges.",
      });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = tags;
    if (color !== undefined) updateData.color = color;
    if (isPrivate !== undefined) {
      updateData.isPrivate = isPrivate;
      // Generate or remove invite code based on privacy
      if (isPrivate) {
        updateData.inviteCode = null;
      } else if (!currentProject.inviteCode) {
        updateData.inviteCode = generateInviteCode();
      }
    }

    const project = await Project.findByIdAndUpdate(projectId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "username email fullName avatar")
      .populate("members.user", "username email fullName avatar");

    res.json({
      success: true,
      message: "Project updated successfully",
      data: {
        project,
      },
    });
  } catch (error) {
    console.error("Update Project Error:", error);

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
        message: "Invalid project ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error updating project",
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Project Owner only)
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only project owner can delete the project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only project owner can delete the project.",
      });
    }

    // Remove project from all members' projects arrays
    await User.updateMany(
      { _id: { $in: project.members.map((member) => member.user) } },
      { $pull: { projects: projectId } }
    );

    // Delete the project
    await Project.findByIdAndDelete(projectId);

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete Project Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error deleting project",
    });
  }
};

// @desc    Join project using invite code
// @route   POST /api/projects/join
// @access  Private
const joinProject = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: "Invite code is required",
      });
    }

    const project = await Project.findOne({ inviteCode })
      .populate("owner", "username email fullName avatar")
      .populate("members.user", "username email fullName avatar");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Invalid invite code",
      });
    }

    // Check if user is already a member
    if (project.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this project",
      });
    }

    // Add user to project members
    project.members.push({
      user: userId,
      role: "member",
      joinedAt: new Date(),
    });

    await project.save();
    await project.populate("members.user", "username email fullName avatar");

    // Add project to user's projects array
    await User.findByIdAndUpdate(userId, {
      $push: { projects: project._id },
    });

    res.json({
      success: true,
      message: "Successfully joined the project",
      data: {
        project,
      },
    });
  } catch (error) {
    console.error("Join Project Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error joining project",
    });
  }
};

// @desc    Leave project
// @route   POST /api/projects/:id/leave
// @access  Private
const leaveProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Project owner cannot leave their own project
    if (project.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message:
          "Project owner cannot leave the project. Transfer ownership or delete the project instead.",
      });
    }

    // Check if user is a member
    if (!project.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    // Remove user from project members
    project.members = project.members.filter(
      (member) => member.user.toString() !== userId.toString()
    );

    await project.save();

    // Remove project from user's projects array
    await User.findByIdAndUpdate(userId, {
      $pull: { projects: projectId },
    });

    res.json({
      success: true,
      message: "Successfully left the project",
    });
  } catch (error) {
    console.error("Leave Project Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error leaving project",
    });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  joinProject,
  leaveProject,
};
