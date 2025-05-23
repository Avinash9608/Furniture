import React, { useState } from 'react';

const TestEditProduct = () => {
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', price);
      formData.append('_t', Date.now()); // Cache-busting parameter

      // Make direct fetch to fixed endpoint
      const response = await fetch(`/api/fix/products/${productId}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      // Parse response
      const data = await response.json();
      console.log('Update response:', data);

      if (response.ok) {
        setResult(data);
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Product Update</h1>
      
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Product ID:
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
              required
            />
          </label>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            New Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
              required
            />
          </label>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            New Price:
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mt-1"
              required
            />
          </label>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="font-bold">Success!</p>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestEditProduct;