const path = require("path");
const multer = require("multer");
const fs = require("fs").promises;
const User = require("../models/User");
const Task = require("../models/Task");
const Project = require("../models/Project");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    avatar: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    attachment: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-rar-compressed",
    ],
  };

  const uploadType = req.params.type || req.body.type || "attachment";
  const allowed = allowedTypes[uploadType] || allowedTypes.attachment;

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`File type ${file.mimetype} not allowed for ${uploadType}`),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
  },
});

// @desc    Upload user avatar
// @route   POST /api/uploads/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user._id;
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Update user's avatar
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    // Delete old avatar if it exists and it's not the default
    if (req.user.avatar && req.user.avatar !== "/uploads/default-avatar.png") {
      const oldAvatarPath = path.join(__dirname, "..", req.user.avatar);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        console.log("Could not delete old avatar:", error.message);
      }
    }

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        user,
        avatarUrl,
      },
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading avatar",
    });
  }
};

// @desc    Upload general file (for messages)
// @route   POST /api/uploads
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: fileUrl,
        url: fileUrl
      },
    });
  } catch (error) {
    console.error("Upload File Error:", error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading file",
    });
  }
};

// @desc    Upload task attachment
// @route   POST /api/uploads/task/:taskId
// @access  Private (Project members only)
const uploadTaskAttachment = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const taskId = req.params.taskId;
    const userId = req.user._id;

    // Check if task exists and user has access
    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is project member
    const project = await Project.findById(task.project._id);
    if (!project.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member of this project.",
      });
    }

    // Process uploaded files
    const attachments = req.files.map((file) => ({
      filename: file.originalname,
      path: `/uploads/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: userId,
      uploadedAt: new Date(),
    }));

    // Add attachments to task
    task.attachments.push(...attachments);
    await task.save();

    // Populate user info for response
    await task.populate("attachments.uploadedBy", "username fullName avatar");

    res.json({
      success: true,
      message: "Files uploaded successfully",
      data: {
        attachments: task.attachments,
      },
    });
  } catch (error) {
    console.error("Upload Task Attachment Error:", error);

    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error uploading attachments",
    });
  }
};

// @desc    Delete attachment
// @route   DELETE /api/uploads/task/:taskId/attachment/:attachmentId
// @access  Private (Project members only)
const deleteAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is project member
    const project = await Project.findById(task.project._id);
    if (!project.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member of this project.",
      });
    }

    // Find the attachment
    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found",
      });
    }

    // Check if user uploaded the file or is project admin
    const userRole = project.getMemberRole(userId);
    if (
      attachment.uploadedBy.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own attachments.",
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "..", attachment.path);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.log("Could not delete file:", error.message);
    }

    // Remove attachment from task
    task.attachments.pull(attachmentId);
    await task.save();

    res.json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Attachment Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting attachment",
    });
  }
};

// @desc    Get file info
// @route   GET /api/uploads/info/:filename
// @access  Private
const getFileInfo = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    try {
      const stats = await fs.stat(filePath);
      const fileInfo = {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true,
      };

      res.json({
        success: true,
        data: fileInfo,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: "File not found",
      });
    }
  } catch (error) {
    console.error("Get File Info Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting file info",
    });
  }
};

// @desc    Clean up orphaned files
// @route   POST /api/uploads/cleanup
// @access  Private (Admin only)
const cleanupFiles = async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "../uploads");
    const files = await fs.readdir(uploadsDir);

    const orphanedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        // Check if file is referenced in any user avatar
        const userWithAvatar = await User.findOne({
          avatar: `/uploads/${file}`,
        });
        if (userWithAvatar) continue;

        // Check if file is referenced in any task attachment
        const taskWithAttachment = await Task.findOne({
          "attachments.path": `/uploads/${file}`,
        });
        if (taskWithAttachment) continue;

        // File is orphaned
        orphanedFiles.push(file);

        // Delete orphaned file
        const filePath = path.join(uploadsDir, file);
        await fs.unlink(filePath);
      } catch (error) {
        errors.push({ file, error: error.message });
      }
    }

    res.json({
      success: true,
      message: "Cleanup completed",
      data: {
        deletedFiles: orphanedFiles,
        errors,
      },
    });
  } catch (error) {
    console.error("Cleanup Files Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during cleanup",
    });
  }
};

module.exports = {
  upload,
  uploadFile,
  uploadAvatar,
  uploadTaskAttachment,
  deleteAttachment,
  getFileInfo,
  cleanupFiles,
};
