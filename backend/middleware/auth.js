const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    // Check if token starts with "Bearer "
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is valid but user not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
};

// Middleware to check project membership
const projectMemberMiddleware = async (req, res, next) => {
  try {
    const Project = require("../models/Project");
    const projectId =
      req.params.projectId || req.body.projectId || req.params.id;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is a member of the project
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not a member of this project.",
      });
    }

    // Add project to request object
    req.project = project;
    next();
  } catch (error) {
    console.error("Project Member Middleware Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error checking project membership",
    });
  }
};

// Middleware to check project admin/owner permissions
const projectAdminMiddleware = async (req, res, next) => {
  try {
    // This middleware should be used after projectMemberMiddleware
    if (!req.project) {
      return res.status(500).json({
        success: false,
        message: "Project middleware must be used before admin middleware",
      });
    }

    // Check if user can edit the project
    if (!req.project.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You need admin or owner privileges for this action.",
      });
    }

    next();
  } catch (error) {
    console.error("Project Admin Middleware Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error checking project admin permissions",
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue without user
    next();
  }
};

module.exports = {
  authMiddleware,
  protect: authMiddleware, // Alias for compatibility
  adminMiddleware,
  projectMemberMiddleware,
  projectAdminMiddleware,
  optionalAuthMiddleware,
};
