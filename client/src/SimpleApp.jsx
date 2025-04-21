import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h1 style={{ color: '#D68C45' }}>Shyam Furnitures</h1>
      <p>Welcome to Shyam Furnitures, your premier furniture destination in Sharsha, Bihar.</p>
      <p>This is a simple test page to verify that the React application is working correctly.</p>
      <button style={{
        backgroundColor: '#D68C45',
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '4px',
        cursor: 'pointer'
      }}>
        Explore Products
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
