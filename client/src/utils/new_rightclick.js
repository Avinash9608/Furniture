// Function to bring back default right click
export const bringBackDefault = (event) => {
  try {
    // Check if the event exists and is cancelable
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    
    // Remove any custom context menu elements if they exist
    const customContextMenu = document.getElementById('custom-context-menu');
    if (customContextMenu) {
      customContextMenu.remove();
    }
    
    return true; // Allow default context menu
  } catch (error) {
    console.error('Error in right-click handler:', error);
    return true; // Allow default context menu even if there's an error
  }
}; 