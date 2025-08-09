import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: token
        },
        autoConnect: true
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('🔌 Connected to server');
        setIsConnected(true);
        
        // Authenticate with token
        newSocket.emit('authenticate', token);
      });

      newSocket.on('authenticated', (data) => {
        console.log('🔐 Socket authenticated:', data);
      });

      newSocket.on('authentication-error', (data) => {
        console.error('🚫 Socket authentication failed:', data);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        setIsConnected(false);
      });

      // Typing indicators
      newSocket.on('user-typing', (data) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, {
              username: data.username,
              timestamp: Date.now()
            });
          } else {
            newMap.delete(data.userId);
          }
          return newMap;
        });

        // Auto-cleanup typing indicators after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              const userTyping = newMap.get(data.userId);
              if (userTyping && Date.now() - userTyping.timestamp > 2500) {
                newMap.delete(data.userId);
                return newMap;
              }
              return prev;
            });
          }, 3000);
        }
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.disconnect();
      };
    } else {
      // User logged out, cleanup socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setTypingUsers(new Map());
      }
    }
  }, [user, token]);

  // Socket utility functions
  const joinProject = (projectId) => {
    if (socket && isConnected) {
      socket.emit('join-project', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && isConnected) {
      socket.emit('leave-project', projectId);
    }
  };

  const sendMessage = (projectId, message, sender) => {
    if (socket && isConnected) {
      socket.emit('send-message', {
        projectId,
        message,
        sender
      });
    }
  };

  const startTyping = (projectId, username) => {
    if (socket && isConnected) {
      socket.emit('typing-start', {
        projectId,
        username
      });
    }
  };

  const stopTyping = (projectId, username) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', {
        projectId,
        username
      });
    }
  };

  const markMessageAsRead = (projectId, messageId) => {
    if (socket && isConnected) {
      socket.emit('message-read', {
        projectId,
        messageId
      });
    }
  };

  const markMessageAsDelivered = (projectId, messageId) => {
    if (socket && isConnected) {
      socket.emit('message-delivered', {
        projectId,
        messageId
      });
    }
  };

  // Get typing users for a project (excluding current user)
  const getTypingUsers = (projectId) => {
    return Array.from(typingUsers.entries())
      .filter(([userId]) => userId !== user?._id)
      .map(([userId, data]) => data);
  };

  const value = {
    socket,
    isConnected,
    typingUsers,
    // Utility functions
    joinProject,
    leaveProject,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
    markMessageAsDelivered,
    getTypingUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
