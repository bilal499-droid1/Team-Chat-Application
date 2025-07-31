const express = require("express");
const multer = require("multer");
const {
  upload,
  uploadAvatar,
  uploadTaskAttachment,
  deleteAttachment,
  getFileInfo,
  cleanupFiles,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/uploads/avatar
// @desc    Upload user avatar
// @access  Private
router.post("/avatar", upload.single("avatar"), uploadAvatar);

// @route   POST /api/uploads/task/:taskId
// @desc    Upload task attachments
// @access  Private
router.post(
  "/task/:taskId",
  upload.array("attachments", 5),
  uploadTaskAttachment
);

// @route   DELETE /api/uploads/task/:taskId/attachment/:attachmentId
// @desc    Delete task attachment
// @access  Private
router.delete("/task/:taskId/attachment/:attachmentId", deleteAttachment);

// @route   GET /api/uploads/info/:filename
// @desc    Get file information
// @access  Private
router.get("/info/:filename", getFileInfo);

// @route   POST /api/uploads/cleanup
// @desc    Clean up orphaned files (Admin only)
// @access  Private
router.post("/cleanup", cleanupFiles);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 5 files per upload.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected field name for file upload.",
      });
    }
  }

  if (error.message.includes("File type")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Upload error occurred",
  });
});

module.exports = router;
