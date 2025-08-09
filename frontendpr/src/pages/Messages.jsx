import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { projectAPI, messageAPI, uploadAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../components/common/Toast';
import { 
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  HashtagIcon,
  EllipsisVerticalIcon,
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import FileUpload from '../components/common/FileUpload';

const Messages = () => {
  const { user } = useAuth();
  const { showToast, ToastContainer } = useToast();
  const { 
    socket, 
    isConnected, 
    joinProject, 
    leaveProject, 
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
    getTypingUsers
  } = useSocket();
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [timeUpdateTrigger, setTimeUpdateTrigger] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Update relative timestamps every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdateTrigger(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchMessages(selectedProject._id);
      
      // Join project room for real-time updates
      if (socket && isConnected) {
        joinProject(selectedProject._id);
      }
      
      // Cleanup: leave previous project room
      return () => {
        if (socket && isConnected && selectedProject) {
          leaveProject(selectedProject._id);
        }
      };
    }
  }, [selectedProject, socket, isConnected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleNewMessage = (data) => {
      const messageWithTimestamp = {
        ...data.message,
        receivedAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, messageWithTimestamp]);
      scrollToBottom();
    };

    // Listen for message delivery confirmations
    const handleMessageDelivered = (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, delivered: true, deliveredAt: data.timestamp || new Date().toISOString() }
          : msg
      ));
    };

    // Listen for message read confirmations
    const handleMessageRead = (data) => {
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, read: true, readAt: data.timestamp || new Date().toISOString() }
          : msg
      ));
    };

    socket.on('new-message', handleNewMessage);
    socket.on('message-delivery-confirmed', handleMessageDelivered);
    socket.on('message-read-confirmed', handleMessageRead);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-delivery-confirmed', handleMessageDelivered);
      socket.off('message-read-confirmed', handleMessageRead);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getProjects();
      const userProjects = response.data.data.projects;
      setProjects(userProjects);
      
      // Auto-select first project if available
      if (userProjects.length > 0 && !selectedProject) {
        setSelectedProject(userProjects[0]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      showToast('Failed to load project chat rooms', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (projectId) => {
    try {
      const response = await messageAPI.getMessages(projectId);
      setMessages(response.data.data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Show demo message if API fails
      setMessages([
        {
          _id: '1',
          content: 'Welcome to the project chat! 🎉 Start collaborating with your team.',
          sender: { 
            _id: 'system', 
            fullName: 'System',
            username: 'system'
          },
          timestamp: new Date().toISOString(),
          type: 'system'
        }
      ]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProject) return;

    setSendingMessage(true);
    
    // Stop typing indicator
    if (isTyping) {
      stopTyping(selectedProject._id, user.fullName || user.username);
      setIsTyping(false);
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const messageContent = newMessage;
      setNewMessage('');

      // Send only via Socket.io - it handles both real-time and persistence
      if (socket && isConnected) {
        socket.emit('send-message', {
          content: messageContent,
          projectId: selectedProject._id,
          messageType: 'text',
          sentAt: new Date().toISOString()
        });
      } else {
        // Fallback to API if socket is not connected
        const response = await messageAPI.sendMessage(selectedProject._id, messageContent);
        setMessages(prev => [...prev, response.data.data.message]);
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp_')));
      setNewMessage(messageContent); // Restore message content
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle typing indicators
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!selectedProject || !socket || !isConnected) return;

    // Start typing if not already typing
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(selectedProject._id, user.fullName || user.username);
    }

    // Reset typing timeout
    clearTimeout(typingTimeoutRef.current);
    
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(selectedProject._id, user.fullName || user.username);
      }, 1000);
    } else {
      // Stop typing immediately if input is empty
      setIsTyping(false);
      stopTyping(selectedProject._id, user.fullName || user.username);
    }
  };

  // Handle file uploads
  const handleFileUpload = async (files) => {
    if (!selectedProject) return;
    
    setShowFileUpload(false);
    setSendingMessage(true);

    try {
      for (const file of files) {
        // Upload file using the API service
        const uploadResponse = await uploadAPI.uploadFile(file);
        const uploadData = uploadResponse.data.data;

        // Send message with file attachment
        const messageData = {
          content: file.name,
          projectId: selectedProject._id,
          messageType: file.type.startsWith('image/') ? 'image' : 'file',
          attachment: {
            filename: uploadData.filename,
            originalName: uploadData.originalName,
            mimetype: uploadData.mimetype,
            size: uploadData.size,
            path: uploadData.path,
            url: uploadData.url
          }
        };

        // Send only via Socket.io - it handles both real-time and persistence
        if (socket && isConnected) {
          socket.emit('send-message', {
            content: messageData.content,
            projectId: selectedProject._id,
            messageType: messageData.messageType,
            attachment: messageData.attachment,
            sentAt: new Date().toISOString()
          });
        } else {
          // Fallback to API if socket is not connected
          const response = await messageAPI.sendMessage(
            selectedProject._id, 
            messageData.content, 
            messageData.messageType,
            messageData.attachment
          );
          setMessages(prev => [...prev, response.data.data.message]);
        }
      }

      showToast(`${files.length} file(s) uploaded successfully!`, 'success');
    } catch (err) {
      console.error('Error uploading files:', err);
      showToast('Failed to upload files. Please try again.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getUserRole = (project) => {
    if (!user || !user._id || !project.members) {
      return 'member';
    }

    const member = project.members.find(m => {
      if (!m.user || !m.user._id) return false;
      const memberId = typeof m.user._id === 'string' ? m.user._id : m.user._id.toString();
      const userId = typeof user._id === 'string' ? user._id : user._id.toString();
      return memberId === userId;
    });
    
    return member?.role || 'member';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      // Show "just now" for messages less than 30 seconds old
      if (diffInSeconds < 30) {
        return 'just now';
      }
      // Show "X minutes ago" for messages less than 1 hour old
      else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
      }
      // Show time for messages within the same day
      else if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      // Show date and time for older messages
      else {
        return date.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer />
      <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg border border-gray-200">
        {/* Left Sidebar - Project Chat Rooms */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Project Chats</h2>
            <p className="text-sm text-gray-600">Team communication</p>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chat rooms..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Project Chat Rooms List */}
          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="p-4 text-center">
                <HashtagIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No project chats available</p>
                <p className="text-sm text-gray-500">Create a project to start chatting</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {projects.map((project) => {
                  const userRole = getUserRole(project);
                  const isSelected = selectedProject?._id === project._id;
                  
                  return (
                    <button
                      key={project._id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full p-3 rounded-lg text-left hover:bg-gray-100 transition-colors ${
                        isSelected ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Project Color Indicator */}
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        ></div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">
                              {project.name}
                            </h3>
                            {/* Unread count placeholder */}
                            {/* <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">2</span> */}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              userRole === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                              userRole === 'admin' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {userRole === 'owner' ? '🔑' : userRole === 'admin' ? '⚙️' : '👤'} {userRole}
                            </span>
                            <span className="text-xs text-gray-500">
                              {project.members?.length || 0} members
                            </span>
                          </div>
                          {/* Last message preview placeholder */}
                          <p className="text-sm text-gray-500 truncate mt-1">
                            Welcome to the project chat...
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedProject ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedProject.color }}
                    ></div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedProject.name}
                      </h2>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <UserGroupIcon className="h-4 w-4" />
                        <span>{selectedProject.members?.length || 0} members</span>
                        <span>•</span>
                        <span className="capitalize">{selectedProject.status}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const showDate = index === 0 || 
                    formatDate(messages[index - 1]?.timestamp) !== formatDate(message.timestamp);
                  
                  return (
                    <div key={message._id}>
                      {/* Date Separator */}
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                            {formatDate(message.timestamp)}
                          </div>
                        </div>
                      )}

                      {/* Message */}
                      <div className={`flex ${
                        message.sender._id === user._id ? 'justify-end' : 'justify-start'
                      }`}>
                        <div className={`max-w-xs lg:max-w-md ${
                          message.type === 'system' ? 'mx-auto' : ''
                        } ${message.receivedAt && Date.now() - new Date(message.receivedAt).getTime() < 3000 ? 'animate-pulse' : ''}`}>
                          {message.type === 'system' ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                              <p className="text-blue-800 text-sm">{message.content}</p>
                            </div>
                          ) : (
                            <div className={`rounded-lg p-3 ${
                              message.sender._id === user._id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              {message.sender._id !== user._id && (
                                <p className="text-xs font-medium mb-1 opacity-75">
                                  {message.sender.fullName || message.sender.username}
                                </p>
                              )}
                              
                              {/* Handle different message types */}
                              {message.type === 'image' || message.messageType === 'image' ? (
                                <div className="space-y-2">
                                  <img
                                    src={`/api/uploads/${message.attachment?.filename || message.content}`}
                                    alt={message.attachment?.originalName || message.content}
                                    className="max-w-xs rounded-lg"
                                    loading="lazy"
                                  />
                                  <p className="text-xs opacity-75">
                                    {message.attachment?.originalName || message.content}
                                  </p>
                                </div>
                              ) : message.type === 'file' || message.messageType === 'file' ? (
                                <div className="flex items-center space-x-3 p-2 bg-white bg-opacity-10 rounded-lg">
                                  <DocumentIcon className="h-8 w-8 opacity-75" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {message.attachment?.originalName || message.content}
                                    </p>
                                    {message.attachment?.size && (
                                      <p className="text-xs opacity-75">
                                        {(message.attachment.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    )}
                                  </div>
                                  <a
                                    href={`/api/uploads/${message.attachment?.filename}`}
                                    download={message.attachment?.originalName}
                                    className="text-xs underline opacity-75 hover:opacity-100"
                                  >
                                    Download
                                  </a>
                                </div>
                              ) : (
                                <p className="text-sm">{message.content}</p>
                              )}
                              
                              <div className={`flex items-center justify-between text-xs mt-1 ${
                                message.sender._id === user._id ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <span className="flex items-center space-x-1">
                                  <span>{formatTime(message.createdAt || message.timestamp)}</span>
                                  {message.sentAt && message.sentAt !== (message.createdAt || message.timestamp) && (
                                    <span className="opacity-75">• Sent {formatTime(message.sentAt)}</span>
                                  )}
                                </span>
                                {message.sender._id === user._id && (
                                  <span className="flex items-center space-x-1">
                                    {message.deliveredAt && (
                                      <span className="text-xs opacity-75">Delivered</span>
                                    )}
                                    <span className="ml-1">
                                      {message.read ? (
                                        <span className="text-blue-200" title="Read">✓✓</span>
                                      ) : message.delivered || message.deliveredAt ? (
                                        <span className="text-blue-300" title="Delivered">✓</span>
                                      ) : (
                                        <span className="text-blue-400" title="Sending">○</span>
                                      )}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing Indicators */}
                {selectedProject && getTypingUsers(selectedProject._id).length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {getTypingUsers(selectedProject._id).map(user => user.username).join(', ')} 
                            {getTypingUsers(selectedProject._id).length === 1 ? ' is' : ' are'} typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <form onSubmit={sendMessage} className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowFileUpload(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Attach files"
                  >
                    <PaperClipIcon className="h-5 w-5" />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder={`Message ${selectedProject.name}...`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sendingMessage}
                    />
                    {/* Connection status indicator */}
                    {!isConnected && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" title="Disconnected - messages will be sent when connection is restored"></div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaceSmileIcon className="h-5 w-5" />
                  </button>

                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <HashtagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a project chat
                </h3>
                <p className="text-gray-600">
                  Choose a project from the sidebar to start messaging with your team
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Members (when project selected) */}
        {selectedProject && (
          <div className="w-64 border-l border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Team Members</h3>
              <p className="text-sm text-gray-600">
                {selectedProject.members?.length || 0} members
              </p>
            </div>
            
            <div className="p-3 space-y-2">
              {selectedProject.members?.map((member) => (
                <div key={member.user._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white transition-colors">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {member.user.fullName?.charAt(0) || member.user.username?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user.fullName || member.user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onFileSelect={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
          maxSize={10 * 1024 * 1024} // 10MB limit
        />
      )}
    </Layout>
  );
};

export default Messages;
