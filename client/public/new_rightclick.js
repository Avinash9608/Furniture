/**
 * This script specifically fixes the event.cancelBubble issue
 * that was causing errors in the deployed environment.
 */
(function() {
  // Execute when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('new_rightclick.js loaded - fixing cancelBubble issues');
    
    // Fix for the cancelBubble error
    // Replace the problematic bringBackDefault function if it exists
    if (typeof window.bringBackDefault === 'function') {
      console.log('Replacing problematic bringBackDefault function');
      
      // Store the original function for reference
      const originalBringBackDefault = window.bringBackDefault;
      
      // Replace with a safe implementation
      window.bringBackDefault = function(event) {
        // Safely handle the event
        if (event) {
          // Use stopPropagation instead of cancelBubble
          if (typeof event.stopPropagation === 'function') {
            event.stopPropagation();
          }
          
          // Set cancelBubble as a property, not a function
          if (event.cancelBubble === undefined || typeof event.cancelBubble !== 'function') {
            event.cancelBubble = true;
          }
        }
        return true;
      };
    }
    
    // Global fix for any code that might try to use cancelBubble as a function
    try {
      // Check if cancelBubble is already properly defined
      const descriptor = Object.getOwnPropertyDescriptor(Event.prototype, 'cancelBubble');
      
      if (!descriptor || typeof descriptor.set !== 'function') {
        // Define cancelBubble as a property with getter/setter
        Object.defineProperty(Event.prototype, 'cancelBubble', {
          get: function() {
            // Return the current propagation stopped state
            return !this.bubbles;
          },
          set: function(value) {
            // When set to true, stop propagation
            if (value) {
              this.stopPropagation();
            }
          },
          configurable: true
        });
        
        console.log('Event.prototype.cancelBubble patched successfully');
      }
    } catch (error) {
      console.error('Failed to patch Event.prototype.cancelBubble:', error);
    }
    
    // Also fix any right-click issues
    document.addEventListener('contextmenu', function(event) {
      // Allow default right-click behavior
      return true;
    });
  });
})();
