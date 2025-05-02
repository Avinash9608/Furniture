// This is a fallback server.js file that redirects to the actual server code
console.log('Starting server from fallback server.js...');
console.log('Redirecting to server/index.js');

// Import and run the actual server code
require('./server/index.js');
