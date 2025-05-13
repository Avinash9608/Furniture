import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';

const TestProduct = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: 'Test Product',
    description: 'Test product description',
    price: '999',
    stock: '10',
    category: '6822c5e3c9343f8816127436' // Use an existing category ID
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const testDirectEndpoint = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Create FormData
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      // Determine base URL
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : window.location.origin;

      // Call the test endpoint
      const response = await fetch(`${baseUrl}/api/direct/products`, {
        method: 'POST',
        body: data
      });

      const responseData = await response.json();
      
      setResult({
        status: response.status,
        data: responseData
      });
    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testRawEndpoint = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Create FormData
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      // Determine base URL
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : window.location.origin;

      // Call the raw endpoint
      const response = await fetch(`${baseUrl}/api/raw/product`, {
        method: 'POST',
        body: data
      });

      const responseData = await response.json();
      
      setResult({
        status: response.status,
        data: responseData
      });
    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Determine base URL
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : window.location.origin;

      // Call the test endpoint
      const response = await fetch(`${baseUrl}/api/test/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();
      
      setResult({
        status: response.status,
        data: responseData
      });
    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Test Product Creation">
      <div className="p-4 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Test Product Creation</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Form</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input
                type="text"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category ID</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={testDirectEndpoint}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Direct Endpoint'}
          </button>
          
          <button
            onClick={testRawEndpoint}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Raw Endpoint'}
          </button>
          
          <button
            onClick={testEndpoint}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Mongoose Endpoint'}
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <h3 className="font-semibold">Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="font-semibold">Result:</h3>
            <p>Status: {result.status}</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-96">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TestProduct;
