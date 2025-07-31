const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// Import database configuration
const connectDB = require("./config/database");

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to Database
connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
  // Continue running server even if DB connection fails initially
});

// Security Middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// CORS Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files middleware for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Import routes
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const messageRoutes = require("./routes/messages");
const uploadRoutes = require("./routes/uploads");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/uploads", uploadRoutes);

app.get("/api", (req, res) => {
  res.json({
    message: "Collaboration Tool API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      projects: "/api/projects",
      tasks: "/api/tasks",
      messages: "/api/messages",
      uploads: "/api/uploads",
    },
  });
});

// Socket.io connection handling
const connectedUsers = new Map(); // Track connected users

io.on("connection", (socket) => {
  console.log("👤 New client connected:", socket.id);

  // Handle user authentication for socket
  socket.on("authenticate", (token) => {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.userId;
      connectedUsers.set(socket.id, {
        userId: decoded.userId,
        socketId: socket.id,
        connectedAt: new Date(),
      });

      console.log(
        `🔐 User ${decoded.userId} authenticated on socket ${socket.id}`
      );
      socket.emit("authenticated", { success: true });
    } catch (error) {
      console.error("Socket authentication error:", error);
      socket.emit("authentication-error", { message: "Invalid token" });
    }
  });

  // Handle joining a project room
  socket.on("join-project", (projectId) => {
    socket.join(projectId);
    console.log(
      `📁 User ${socket.userId || socket.id} joined project: ${projectId}`
    );

    // Notify other users in the project
    socket.to(projectId).emit("user-joined-project", {
      userId: socket.userId,
      socketId: socket.id,
      timestamp: new Date(),
    });

    // Send current online users in project
    const projectUsers = Array.from(
      io.sockets.adapter.rooms.get(projectId) || []
    )
      .map((socketId) => connectedUsers.get(socketId))
      .filter((user) => user && user.userId);

    socket.emit("project-users-online", projectUsers);
  });

  // Handle leaving a project room
  socket.on("leave-project", (projectId) => {
    socket.leave(projectId);
    console.log(
      `📁 User ${socket.userId || socket.id} left project: ${projectId}`
    );

    socket.to(projectId).emit("user-left-project", {
      userId: socket.userId,
      socketId: socket.id,
      timestamp: new Date(),
    });
  });

  // Handle real-time task updates
  socket.on("task-created", (data) => {
    console.log("📝 Task created:", data.task.title);
    socket.to(data.projectId).emit("task-created", {
      task: data.task,
      createdBy: data.createdBy,
      timestamp: new Date(),
    });
  });

  socket.on("task-updated", (data) => {
    console.log("📝 Task updated:", data.task.title);
    socket.to(data.projectId).emit("task-updated", {
      task: data.task,
      updatedBy: data.updatedBy,
      changes: data.changes,
      timestamp: new Date(),
    });
  });

  socket.on("task-moved", (data) => {
    console.log("🔄 Task moved:", data.taskId);
    socket.to(data.projectId).emit("task-moved", {
      taskId: data.taskId,
      newStatus: data.newStatus,
      newPosition: data.newPosition,
      movedBy: data.movedBy,
      timestamp: new Date(),
    });
  });

  // Handle real-time chat messages
  socket.on("send-message", async (data) => {
    try {
      const Message = require("./models/Message");

      // Save message to database
      const message = new Message({
        content: data.content,
        sender: socket.userId,
        project: data.projectId,
        messageType: data.messageType || "text",
        attachment: data.attachment || null,
      });

      await message.save();
      await message.populate("sender", "username fullName avatar");

      console.log("💬 New message from:", message.sender.username);

      // Broadcast to all users in the project
      io.to(data.projectId).emit("new-message", {
        message: message,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("message-error", { message: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing-start", (data) => {
    socket.to(data.projectId).emit("user-typing", {
      userId: socket.userId,
      projectId: data.projectId,
      timestamp: new Date(),
    });
  });

  socket.on("typing-stop", (data) => {
    socket.to(data.projectId).emit("user-stopped-typing", {
      userId: socket.userId,
      projectId: data.projectId,
      timestamp: new Date(),
    });
  });

  // Handle notifications
  socket.on("send-notification", (data) => {
    // Send notification to specific user(s)
    if (data.targetUserId) {
      const targetSocket = Array.from(connectedUsers.entries()).find(
        ([socketId, user]) => user.userId === data.targetUserId
      );

      if (targetSocket) {
        io.to(targetSocket[0]).emit("notification", {
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          timestamp: new Date(),
        });
      }
    } else if (data.projectId) {
      // Send to all project members
      socket.to(data.projectId).emit("notification", {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        timestamp: new Date(),
      });
    }
  });

  // Handle task updates (legacy support)
  socket.on("task-update", (data) => {
    console.log("📝 Task update:", data);
    socket.to(data.projectId).emit("task-updated", data);
  });

  // Handle new messages (legacy support)
  socket.on("new-message", (data) => {
    console.log("💬 New message:", data);
    socket.to(data.projectId).emit("message-received", data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("👋 Client disconnected:", socket.id);

    // Remove from connected users
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      connectedUsers.delete(socket.id);

      // Notify all rooms this user was in
      const rooms = Array.from(socket.rooms);
      rooms.forEach((room) => {
        if (room !== socket.id) {
          // Skip the socket's own room
          socket.to(room).emit("user-disconnected", {
            userId: userData.userId,
            socketId: socket.id,
            timestamp: new Date(),
          });
        }
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 ===============================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🚀 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
  console.log("🚀 ===============================================");
});

// Export for testing
module.exports = { app, server, io };
