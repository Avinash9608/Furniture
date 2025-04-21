// This script fixes the event.cancelBubble issue
document.addEventListener('DOMContentLoaded', function() {
  // Override any existing right-click handlers
  document.addEventListener('contextmenu', function(event) {
    // Allow default right-click behavior
    return true;
  });
  
  // Fix for the cancelBubble error
  if (typeof window.bringBackDefault === 'function') {
    // Replace the problematic function
    window.bringBackDefault = function(event) {
      // Safe implementation that doesn't use cancelBubble
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      return true;
    };
  }
});
