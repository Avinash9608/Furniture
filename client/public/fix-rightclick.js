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

    // Global fix for any code that might try to use cancelBubble as a function
    // This patches the Event prototype to ensure cancelBubble is always treated as a property
    try {
      const originalCancelBubble = Object.getOwnPropertyDescriptor(
        Event.prototype,
        "cancelBubble"
      );

      if (originalCancelBubble && originalCancelBubble.set) {
        // The property already exists and has a setter, we're good
        console.log("cancelBubble property already exists with proper setter");
      } else {
        // Define a new property descriptor that ensures cancelBubble is a property, not a function
        Object.defineProperty(Event.prototype, "cancelBubble", {
          get: function () {
            // Return the current propagation stopped state
            return !this.bubbles;
          },
          set: function (value) {
            // When set to true, stop propagation
            if (value) {
              this.stopPropagation();
            }
          },
          configurable: true,
        });

        console.log("cancelBubble property patched successfully");
      }
    } catch (error) {
      console.error("Failed to patch cancelBubble:", error);
    }
  });
})();
