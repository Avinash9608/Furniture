/**
 * A safe toast utility that works with our custom Toast component
 *
 * This utility provides a consistent interface for showing toast notifications.
 * It uses our custom Toast component and falls back to console methods.
 */

import { toast as customToast } from "../components/Toast";

// Create a safe toast object
const toast = {
  warning: (message, options = {}) => {
    console.warn("Toast warning:", message);
    try {
      customToast.warning(message, options);
    } catch (error) {
      console.error("Error showing toast warning:", error);
    }
  },

  error: (message, options = {}) => {
    console.error("Toast error:", message);
    try {
      customToast.error(message, options);
    } catch (error) {
      console.error("Error showing toast error:", error);
    }
  },

  success: (message, options = {}) => {
    console.log("Toast success:", message);
    try {
      customToast.success(message, options);
    } catch (error) {
      console.error("Error showing toast success:", error);
    }
  },

  info: (message, options = {}) => {
    console.log("Toast info:", message);
    try {
      customToast.info(message, options);
    } catch (error) {
      console.error("Error showing toast info:", error);
    }
  },
};

export default toast;
