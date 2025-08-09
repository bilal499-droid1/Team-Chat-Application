# 🚀 Real-Time Communication App

A modern, real-time team collaboration platform similar to Trello, built with the MERN stack and Socket.io for seamless team communication and project management.

## ✨ Features

### 🔐 Core Functionality
- **User Authentication** - Secure JWT-based registration and login
- **Project Management** - Create, manage, and collaborate on projects with team members
- **Kanban Board** - Intuitive drag-and-drop task management system
- **Real-time Chat** - Live messaging with file sharing support
- **File Uploads** - Support for avatars and task attachments
- **Team Collaboration** - Role-based permissions and project invite system

### ⚡ Real-time Features
- Live task updates across all connected users
- Real-time chat with typing indicators
- Instant notifications for task assignments and updates
- Live project member activity

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io v4.7.2
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting

### Frontend (Coming Soon)
- **Framework**: React.js
- **State Management**: Context API / Redux
- **Styling**: Tailwind CSS
- **Real-time Client**: Socket.io-client
- **Drag & Drop**: react-beautiful-dnd

## 📁 Project Structure

```
Real Time Tool/
├── backend/
│   ├── config/
│   │   └── database.js              # MongoDB connection configuration
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── projectController.js     # Project management
│   │   ├── taskController.js        # Task/Kanban operations
│   │   ├── messageController.js     # Chat functionality
│   │   └── uploadController.js      # File upload handling
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication middleware
│   │   └── validation.js            # Input validation middleware
│   ├── models/
│   │   ├── User.js                  # User schema and methods
│   │   ├── Project.js               # Project schema with team management
│   │   ├── Task.js                  # Task schema with Kanban features
│   │   └── Message.js               # Message schema with reactions
│   ├── routes/
│   │   ├── auth.js                  # Authentication routes
│   │   ├── projects.js              # Project management routes
│   │   ├── tasks.js                 # Task management routes
│   │   ├── messages.js              # Chat/messaging routes
│   │   └── uploads.js               # File upload routes
│   ├── utils/
│   │   └── helpers.js               # Utility functions
│   ├── uploads/                     # File storage directory
│   ├── .env                         # Environment variables
│   ├── package.json                 # Dependencies and scripts
│   └── server.js                    # Main server file
└── frontend/                        # Frontend (Coming Soon)
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bilal499-droid1/Real-time-Communication-app.git
   cd Real-time-Communication-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/collaboration-tool
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Start the development server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

The backend server will start on `http://localhost:5000`

### 🧪 Testing the API

You can test the API endpoints using tools like Postman or curl. Here are some example requests:

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!","fullName":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"Test123!"}'
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register    - User registration
POST /api/auth/login       - User login  
GET  /api/auth/me          - Get current user profile
PUT  /api/auth/profile     - Update user profile
PUT  /api/auth/password    - Change password
POST /api/auth/refresh     - Refresh JWT token
```

### Project Management
```
GET    /api/projects           - Get user's projects
POST   /api/projects           - Create new project
GET    /api/projects/:id       - Get project details
PUT    /api/projects/:id       - Update project
DELETE /api/projects/:id       - Delete project
POST   /api/projects/join      - Join project via invite code
POST   /api/projects/:id/leave - Leave project
PUT    /api/projects/:id/members/:userId/role - Update member role
```

### Task Management (Kanban Board)
```
GET    /api/tasks/project/:projectId  - Get all tasks for project
POST   /api/tasks                     - Create new task
GET    /api/tasks/:id                 - Get single task details
PUT    /api/tasks/:id                 - Update task
DELETE /api/tasks/:id                 - Delete task
POST   /api/tasks/reorder             - Reorder tasks (drag & drop)
POST   /api/tasks/:id/comments        - Add comment to task
GET    /api/tasks/stats/:projectId    - Get task statistics
```

### Real-time Chat
```
GET    /api/messages/:projectId     - Get messages for a project
POST   /api/messages                - Send new message
GET    /api/messages/unread/:userId - Get unread message count
```

### File Management
```
POST   /api/uploads                     - Upload files for messages
POST   /api/uploads/avatar              - Upload user avatar  
POST   /api/uploads/task/:taskId        - Upload task attachment
DELETE /api/uploads/task/:taskId/attachment/:attachmentId - Delete attachment
GET    /api/uploads/info/:filename      - Get file information
POST   /api/uploads/cleanup             - Clean orphaned files (Admin)
```

## 🔌 Socket.io Real-time Events

### Client → Server Events
- `authenticate` - Authenticate user with JWT token
- `join-project` - Join a project room for real-time updates
- `leave-project` - Leave project room
- `send-message` - Send chat message
- `message-delivered` - Confirm message delivery
- `message-read` - Mark message as read
- `typing-start` - User started typing
- `typing-stop` - User stopped typing
- `task-created` - New task created
- `task-updated` - Task modified
- `task-moved` - Task drag & drop event
- `task-update` - Task update (legacy support)
- `new-message` - New message (legacy support)

### Server → Client Events
- `authenticated` - Authentication successful
- `authentication-error` - Authentication failed
- `user-joined-project` - User joined project
- `user-left-project` - User left project
- `new-message` - New chat message
- `message-delivery-confirmed` - Message delivery confirmed
- `message-read-confirmed` - Message read confirmed
- `message-error` - Message sending failed
- `user-typing` - Someone is typing
- `user-stopped-typing` - Someone stopped typing
- `task-created` - New task added
- `task-updated` - Task modified
- `task-moved` - Task moved/repositioned
- `notification` - General notifications
- `user-disconnected` - User disconnected from project

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcryptjs with salt rounds
- **Rate Limiting** to prevent API abuse
- **CORS** configuration for cross-origin requests
- **Input Validation** and sanitization
- **File Upload Security** with type and size restrictions
- **Environment Variables** for sensitive configuration

## 🚀 Deployment

### Backend Deployment (Node.js)

1. **Environment Variables for Production:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   JWT_SECRET=your-production-jwt-secret
   NODE_ENV=production
   PORT=5000
   CLIENT_URL=https://your-frontend-domain.com
   ```

2. **Deploy to platforms like:**
   - Heroku
   - Vercel
   - Railway
   - DigitalOcean
   - AWS EC2

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Bilal** - [@bilal499-droid1](https://github.com/bilal499-droid1)

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- MongoDB team for the powerful database
- Socket.io team for real-time communication capabilities
- All the open-source contributors who made this project possible

---

⭐ **Star this repo if you find it helpful!** ⭐
