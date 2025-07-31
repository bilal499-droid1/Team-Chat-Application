const crypto = require("crypto");

// Generate random invite code for projects
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

// Generate random filename for uploads
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  const extension = originalName.split(".").pop();
  return `${timestamp}-${random}.${extension}`;
};

// Validate hex color code
const isValidHexColor = (color) => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// Format file size in readable format
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

// Calculate pagination
const getPagination = (page = 1, limit = 10) => {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);

  const validPage = parsedPage > 0 ? parsedPage : 1;
  const validLimit = parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 10;

  const skip = (validPage - 1) * validLimit;

  return {
    page: validPage,
    limit: validLimit,
    skip,
  };
};

// Create response object
const createResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  const mongoose = require("mongoose");
  return mongoose.Types.ObjectId.isValid(id);
};

// Escape regex special characters
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = {
  generateInviteCode,
  generateFileName,
  isValidHexColor,
  formatFileSize,
  sanitizeFilename,
  getPagination,
  createResponse,
  isValidObjectId,
  escapeRegex,
};
