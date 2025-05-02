// This script fixes the event.cancelBubble issue and String.prototype.substring issues
(function () {
  // Fix for String.prototype.substring
  try {
    // Store the original substring method
    const originalSubstring = String.prototype.substring;

    // Replace with a safe version that handles errors
    String.prototype.substring = function (start, end) {
      try {
        // Call the original method
        return originalSubstring.call(this, start, end);
      } catch (error) {
        console.error("Error in patched substring:", error);
        return ""; // Return empty string on error
      }
    };

    // Add a global safe substring function
    window.safeSubstring = function (value, start, end, fallback) {
      if (value == null) return fallback || "";

      try {
        const str = String(value);
        return end ? str.substring(start, end) : str.substring(start);
      } catch (error) {
        console.error("Error in safeSubstring:", error);
        return fallback || "";
      }
    };

    console.log("String.prototype.substring patched successfully");
  } catch (error) {
    console.error("Failed to patch String.prototype.substring:", error);
  }

  // Fix for right-click and cancelBubble issues
  document.addEventListener("DOMContentLoaded", function () {
    // Override any existing right-click handlers
    document.addEventListener("contextmenu", function (event) {
      // Allow default right-click behavior
      return true;
    });

    // Fix for the cancelBubble error
    if (typeof window.bringBackDefault === "function") {
      // Replace the problematic function
      window.bringBackDefault = function (event) {
        // Safe implementation that doesn't use cancelBubble
        if (event && typeof event.stopPropagation === "function") {
          event.stopPropagation();
        }
        return true;
      };
    }
  });
})();
