/**
 * Utility to test the admin messages page
 * This script can be run in the browser console to check if the admin messages page
 * is correctly handling the direct database response format
 */

// Function to test the admin messages page
const testAdminMessages = async () => {
  console.log('Testing admin messages page...');
  
  try {
    // Fetch messages directly from the API
    const response = await fetch('/api/admin/messages');
    const data = await response.json();
    
    console.log('API response:', data);
    
    // Check if the response has the expected format
    if (data && data.source === 'direct_database') {
      console.log('✅ API response has the correct format (direct_database)');
      
      if (data.data && Array.isArray(data.data)) {
        console.log(`✅ API response contains ${data.data.length} messages`);
        
        // Log the first message
        if (data.data.length > 0) {
          console.log('First message:', data.data[0]);
        }
      } else {
        console.error('❌ API response does not contain an array of messages');
      }
    } else {
      console.warn('⚠️ API response does not have the direct_database source');
      console.log('Response source:', data.source);
    }
    
    // Now let's check if the frontend is correctly handling this response
    console.log('Checking if the frontend is correctly handling the response...');
    
    // Get the messages displayed on the page
    const messageElements = document.querySelectorAll('[data-message-id]');
    console.log(`Found ${messageElements.length} message elements on the page`);
    
    // Compare with the API response
    if (data && data.data && Array.isArray(data.data)) {
      if (messageElements.length === data.data.length) {
        console.log('✅ Number of messages on the page matches the API response');
      } else {
        console.error(`❌ Number of messages on the page (${messageElements.length}) does not match the API response (${data.data.length})`);
      }
      
      // Check if the first message ID matches
      if (messageElements.length > 0 && data.data.length > 0) {
        const firstMessageId = messageElements[0].getAttribute('data-message-id');
        const firstApiMessageId = data.data[0]._id;
        
        if (firstMessageId === firstApiMessageId) {
          console.log('✅ First message ID matches the API response');
        } else {
          console.error(`❌ First message ID on the page (${firstMessageId}) does not match the API response (${firstApiMessageId})`);
        }
      }
    }
    
    return {
      apiResponse: data,
      messageElements: messageElements.length,
      success: messageElements.length > 0 && data && data.data && Array.isArray(data.data) && messageElements.length === data.data.length
    };
  } catch (error) {
    console.error('Error testing admin messages:', error);
    return {
      error: error.message,
      success: false
    };
  }
};

// Export the function
export default testAdminMessages;

// If running in the browser console, execute the function
if (typeof window !== 'undefined') {
  console.log('Run testAdminMessages() to test the admin messages page');
}
