import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = type === 'success' 
    ? 'bg-green-50 border-green-200' 
    : 'bg-red-50 border-red-200';
  
  const textColor = type === 'success' 
    ? 'text-green-800' 
    : 'text-red-800';
  
  const iconColor = type === 'success' 
    ? 'text-green-400' 
    : 'text-red-400';

  const Icon = type === 'success' ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${bgColor} border rounded-lg p-4 shadow-lg`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${iconColor} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`ml-4 ${textColor} hover:opacity-75`}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};

export default Toast;
