import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Project API functions
export const projectAPI = {
  // Get all projects
  getProjects: () => api.get('/projects'),
  
  // Get single project
  getProject: (id) => api.get(`/projects/${id}`),
  
  // Create project
  createProject: (data) => api.post('/projects', data),
  
  // Update project
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  
  // Delete project
  deleteProject: (id) => api.delete(`/projects/${id}`),
  
  // Join project with invite code
  joinProject: (inviteCode) => api.post('/projects/join', { inviteCode }),
  
  // Leave project
  leaveProject: (id) => api.post(`/projects/${id}/leave`),
  
  // Invite user to project
  inviteToProject: (id, email, role = 'member') => {
    console.log('API inviteToProject called with:', { id, email, role });
    const url = `/projects/${id}/invite`;
    console.log('Constructed URL:', url);
    return api.post(url, { email, role });
  },
  
  // Update member role
  updateMemberRole: (projectId, userId, role) => 
    api.put(`/projects/${projectId}/members/${userId}/role`, { role }),
  
  // Remove member
  removeMember: (projectId, userId) => 
    api.delete(`/projects/${projectId}/members/${userId}`),
};

// Message API functions
export const messageAPI = {
  // Get messages for a project chat room
  getMessages: (projectId, page = 1, limit = 50) => 
    api.get(`/messages/project/${projectId}?page=${page}&limit=${limit}`),
  
  // Send a message to project chat room
  sendMessage: (projectId, content, messageType = 'text', attachment = null) =>
    api.post('/messages', { content, project: projectId, messageType, attachment }),
  
  // Get unread count
  getUnreadCount: (userId) =>
    api.get(`/messages/unread/${userId}`),
};

// Upload API functions
export const uploadAPI = {
  // Upload a file (for messages)
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Upload avatar
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return api.post('/uploads/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Upload task attachment
  uploadTaskAttachment: (taskId, files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });
    
    return api.post(`/uploads/task/${taskId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
