import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';

const SimpleAddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  });
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Determine base URL
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5000' 
          : window.location.origin;
          
        const response = await fetch(`${baseUrl}/api/categories`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Extract categories from response
          let categoriesList = [];
          if (data.data && Array.isArray(data.data)) {
            categoriesList = data.data;
          } else if (Array.isArray(data)) {
            categoriesList = data;
          }
          
          setCategories(categoriesList);
        } else {
          console.error('Failed to fetch categories');
          // Create dummy categories for testing
          setCategories([
            { _id: '6822c5e3c9343f8816127436', name: 'Test Category 1' },
            { _id: 'dummy2', name: 'Test Category 2' }
          ]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Create dummy categories for testing
        setCategories([
          { _id: '6822c5e3c9343f8816127436', name: 'Test Category 1' },
          { _id: 'dummy2', name: 'Test Category 2' }
        ]);
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate form
      if (!formData.name) {
        setError('Product name is required');
        setLoading(false);
        return;
      }
      
      if (!formData.description) {
        setError('Product description is required');
        setLoading(false);
        return;
      }
      
      if (!formData.price) {
        setError('Product price is required');
        setLoading(false);
        return;
      }
      
      if (!formData.category) {
        setError('Please select a category');
        setLoading(false);
        return;
      }
      
      // Create FormData
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      // Determine base URL
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      // Try the raw endpoint first
      try {
        console.log('Submitting to raw endpoint...');
        const rawResponse = await fetch(`${baseUrl}/api/raw/product`, {
          method: 'POST',
          body: data
        });
        
        if (rawResponse.ok) {
          const responseData = await rawResponse.json();
          console.log('Raw endpoint success:', responseData);
          
          setSuccess('Product created successfully!');
          
          // Redirect after a delay
          setTimeout(() => {
            navigate('/admin/products', {
              state: { successMessage: 'Product created successfully!' }
            });
          }, 2000);
          
          return;
        } else {
          console.error('Raw endpoint failed with status:', rawResponse.status);
          // Continue to next approach
        }
      } catch (rawError) {
        console.error('Error with raw endpoint:', rawError);
        // Continue to next approach
      }
      
      // Try the direct endpoint as fallback
      try {
        console.log('Submitting to direct endpoint...');
        const directResponse = await fetch(`${baseUrl}/api/direct/products`, {
          method: 'POST',
          body: data
        });
        
        if (directResponse.ok) {
          const responseData = await directResponse.json();
          console.log('Direct endpoint success:', responseData);
          
          setSuccess('Product created successfully!');
          
          // Redirect after a delay
          setTimeout(() => {
            navigate('/admin/products', {
              state: { successMessage: 'Product created successfully!' }
            });
          }, 2000);
          
          return;
        } else {
          console.error('Direct endpoint failed with status:', directResponse.status);
          // Continue to next approach
        }
      } catch (directError) {
        console.error('Error with direct endpoint:', directError);
        // Continue to next approach
      }
      
      // If all approaches failed, show error
      setError('Failed to create product. Please try again.');
    } catch (err) {
      console.error('Error creating product:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdminLayout title="Simple Add Product">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Product (Simple)</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows="4"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SimpleAddProduct;
