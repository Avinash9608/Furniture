import React, { useState, useEffect } from 'react';

// Toast container component
export const ToastContainer = ({ position = 'top-right', children }) => {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
  };

  return (
    <div className={positionClasses[position]}>
      <div className="flex flex-col space-y-2">
        {children}
      </div>
    </div>
  );
};

// Individual toast component
export const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 300); // Allow animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  const handleClose = () => {
    setVisible(false);
    if (onClose) setTimeout(onClose, 300); // Allow animation to complete
  };

  return (
    <div 
      className={`
        ${typeClasses[type]} rounded-md shadow-lg p-4 flex items-start justify-between
        transition-all duration-300 ease-in-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        max-w-xs w-full
      `}
    >
      <div className="flex-1">{message}</div>
      <button 
        onClick={handleClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
      >
        ×
      </button>
    </div>
  );
};

// Toast manager
const toasts = [];
let toastId = 0;
let setToastsState = null;

export const toast = {
  _getNewId: () => {
    toastId += 1;
    return toastId;
  },
  
  _register: (setState) => {
    setToastsState = setState;
  },
  
  _renderToasts: () => {
    if (setToastsState) {
      setToastsState([...toasts]);
    }
  },
  
  success: (message, options = {}) => {
    const id = toast._getNewId();
    const newToast = { id, message, type: 'success', ...options };
    toasts.push(newToast);
    toast._renderToasts();
    
    return id;
  },
  
  error: (message, options = {}) => {
    const id = toast._getNewId();
    const newToast = { id, message, type: 'error', ...options };
    toasts.push(newToast);
    toast._renderToasts();
    
    return id;
  },
  
  warning: (message, options = {}) => {
    const id = toast._getNewId();
    const newToast = { id, message, type: 'warning', ...options };
    toasts.push(newToast);
    toast._renderToasts();
    
    return id;
  },
  
  info: (message, options = {}) => {
    const id = toast._getNewId();
    const newToast = { id, message, type: 'info', ...options };
    toasts.push(newToast);
    toast._renderToasts();
    
    return id;
  },
  
  dismiss: (id) => {
    const index = toasts.findIndex(toast => toast.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
      toast._renderToasts();
    }
  },
  
  dismissAll: () => {
    toasts.length = 0;
    toast._renderToasts();
  }
};

// Toast container with state management
export const ToastManager = ({ position = 'top-right' }) => {
  const [toastList, setToastList] = useState([]);
  
  useEffect(() => {
    toast._register(setToastList);
    return () => toast._register(null);
  }, []);
  
  const handleClose = (id) => {
    toast.dismiss(id);
  };
  
  return (
    <ToastContainer position={position}>
      {toastList.map(({ id, message, type, duration }) => (
        <Toast
          key={id}
          message={message}
          type={type}
          duration={duration || 5000}
          onClose={() => handleClose(id)}
        />
      ))}
    </ToastContainer>
  );
};

export default { ToastManager, toast };
