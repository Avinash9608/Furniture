import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const V2AddProduct = () => {
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
    category: '',
    material: '',
    color: '',
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    featured: false,
    discountPrice: ''
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
    
    if (name.startsWith('dimension_')) {
      const dimension = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimension]: parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
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
      
      // Add basic fields
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock || '1');
      data.append('category', formData.category);
      
      // Add optional fields
      if (formData.material) data.append('material', formData.material);
      if (formData.color) data.append('color', formData.color);
      if (formData.discountPrice) data.append('discountPrice', formData.discountPrice);
      
      // Add dimensions as JSON string
      data.append('dimensions', JSON.stringify(formData.dimensions));
      
      // Add featured flag
      data.append('featured', formData.featured.toString());
      
      // Determine base URL
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      // Submit to the V2 API endpoint
      console.log('Submitting to V2 API endpoint...');
      const response = await fetch(`${baseUrl}/api/v2/products`, {
        method: 'POST',
        body: data
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Product created successfully:', responseData);
        
        setSuccess('Product created successfully!');
        
        // Redirect after a delay
        setTimeout(() => {
          navigate('/admin/products', {
            state: { successMessage: 'Product created successfully!' }
          });
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdminLayout title="V2 Add Product">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Product (V2)</h1>
        
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Discount Price
              </label>
              <input
                type="number"
                name="discountPrice"
                value={formData.discountPrice}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dimensions
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500">Length (cm)</label>
                <input
                  type="number"
                  name="dimension_length"
                  value={formData.dimensions.length}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Width (cm)</label>
                <input
                  type="number"
                  name="dimension_width"
                  value={formData.dimensions.width}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Height (cm)</label>
                <input
                  type="number"
                  name="dimension_height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Featured Product
            </label>
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

export default V2AddProduct;
