/**
 * A safe toast utility that works with or without react-toastify
 * 
 * This utility provides a consistent interface for showing toast notifications,
 * whether react-toastify is available or not. If react-toastify is not available,
 * it falls back to console methods.
 */

// Check if ReactToastify is available globally
const hasToastify = typeof window !== 'undefined' && window.ReactToastify && window.ReactToastify.toast;

// Create a safe toast object
const toast = {
  warning: (message, options = {}) => {
    console.warn('Toast warning:', message);
    if (hasToastify) {
      try {
        window.ReactToastify.toast.warning(message, options);
      } catch (error) {
        console.error('Error showing toast warning:', error);
      }
    }
  },
  
  error: (message, options = {}) => {
    console.error('Toast error:', message);
    if (hasToastify) {
      try {
        window.ReactToastify.toast.error(message, options);
      } catch (error) {
        console.error('Error showing toast error:', error);
      }
    }
  },
  
  success: (message, options = {}) => {
    console.log('Toast success:', message);
    if (hasToastify) {
      try {
        window.ReactToastify.toast.success(message, options);
      } catch (error) {
        console.error('Error showing toast success:', error);
      }
    }
  },
  
  info: (message, options = {}) => {
    console.log('Toast info:', message);
    if (hasToastify) {
      try {
        window.ReactToastify.toast.info(message, options);
      } catch (error) {
        console.error('Error showing toast info:', error);
      }
    }
  }
};

export default toast;
