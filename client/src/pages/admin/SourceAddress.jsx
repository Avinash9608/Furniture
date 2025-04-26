import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminLayout from "../../components/admin/AdminLayout";
import Alert from "../../components/Alert";
import axios from "axios";

const SourceAddress = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    isActive: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fetch source addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a direct axios instance
      const directApi = axios.create({
        timeout: 30000, // Increased timeout
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      
      // Try multiple endpoints
      const baseUrl = window.location.origin;
      const endpoints = [
        `${baseUrl}/api/source-address`,
        `${baseUrl}/source-address`,
        `${baseUrl}/api/api/source-address`,
        "https://furniture-q3nb.onrender.com/api/source-address",
      ];
      
      let addressesData = [];
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch source addresses from: ${endpoint}`);
          const response = await directApi.get(endpoint);
          console.log("Source addresses fetched successfully:", response.data);
          
          if (response.data && response.data.data) {
            addressesData = response.data.data;
            break;
          } else if (response.data && Array.isArray(response.data)) {
            addressesData = response.data;
            break;
          }
        } catch (error) {
          console.warn(`Error fetching source addresses from ${endpoint}:`, error);
          // Continue to the next endpoint
        }
      }
      
      setAddresses(addressesData);
    } catch (error) {
      console.error("Error fetching source addresses:", error);
      setError("Failed to fetch source addresses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses on component mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create a direct axios instance
      const directApi = axios.create({
        timeout: 30000, // Increased timeout
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      
      // Try multiple endpoints
      const baseUrl = window.location.origin;
      let endpoints = [];
      
      if (editMode) {
        endpoints = [
          `${baseUrl}/api/source-address/${editId}`,
          `${baseUrl}/source-address/${editId}`,
          `${baseUrl}/api/api/source-address/${editId}`,
          `https://furniture-q3nb.onrender.com/api/source-address/${editId}`,
        ];
      } else {
        endpoints = [
          `${baseUrl}/api/source-address`,
          `${baseUrl}/source-address`,
          `${baseUrl}/api/api/source-address`,
          "https://furniture-q3nb.onrender.com/api/source-address",
        ];
      }
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to ${editMode ? 'update' : 'create'} source address at: ${endpoint}`);
          const response = editMode
            ? await directApi.put(endpoint, formData)
            : await directApi.post(endpoint, formData);
          
          console.log("Source address saved successfully:", response.data);
          setSuccess(editMode ? "Source address updated successfully!" : "Source address created successfully!");
          
          // Reset form and fetch updated addresses
          setFormData({
            name: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "India",
            phone: "",
            isActive: false,
          });
          setEditMode(false);
          setEditId(null);
          fetchAddresses();
          break;
        } catch (error) {
          console.warn(`Error saving source address at ${endpoint}:`, error);
          // Continue to the next endpoint
        }
      }
    } catch (err) {
      console.error("Error saving source address:", err);
      setError("Failed to save source address. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (address) => {
    setFormData({
      name: address.name,
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
      isActive: address.isActive,
    });
    setEditMode(true);
    setEditId(address._id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this source address?")) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create a direct axios instance
      const directApi = axios.create({
        timeout: 30000, // Increased timeout
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      
      // Try multiple endpoints
      const baseUrl = window.location.origin;
      const endpoints = [
        `${baseUrl}/api/source-address/${id}`,
        `${baseUrl}/source-address/${id}`,
        `${baseUrl}/api/api/source-address/${id}`,
        `https://furniture-q3nb.onrender.com/api/source-address/${id}`,
      ];
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to delete source address at: ${endpoint}`);
          const response = await directApi.delete(endpoint);
          
          console.log("Source address deleted successfully:", response.data);
          setSuccess("Source address deleted successfully!");
          
          // Fetch updated addresses
          fetchAddresses();
          break;
        } catch (error) {
          console.warn(`Error deleting source address at ${endpoint}:`, error);
          // Continue to the next endpoint
        }
      }
    } catch (err) {
      console.error("Error deleting source address:", err);
      setError("Failed to delete source address. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle set as active button click
  const handleSetActive = async (id) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create a direct axios instance
      const directApi = axios.create({
        timeout: 30000, // Increased timeout
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      
      // Find the address to update
      const address = addresses.find(addr => addr._id === id);
      if (!address) {
        setError("Address not found");
        setLoading(false);
        return;
      }
      
      // Update the address to be active
      const updatedAddress = {
        ...address,
        isActive: true
      };
      
      // Try multiple endpoints
      const baseUrl = window.location.origin;
      const endpoints = [
        `${baseUrl}/api/source-address/${id}`,
        `${baseUrl}/source-address/${id}`,
        `${baseUrl}/api/api/source-address/${id}`,
        `https://furniture-q3nb.onrender.com/api/source-address/${id}`,
      ];
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to set source address as active at: ${endpoint}`);
          const response = await directApi.put(endpoint, updatedAddress);
          
          console.log("Source address set as active successfully:", response.data);
          setSuccess("Source address set as active successfully!");
          
          // Fetch updated addresses
          fetchAddresses();
          break;
        } catch (error) {
          console.warn(`Error setting source address as active at ${endpoint}:`, error);
          // Continue to the next endpoint
        }
      }
    } catch (err) {
      console.error("Error setting source address as active:", err);
      setError("Failed to set source address as active. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit mode
  const handleCancel = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      phone: "",
      isActive: false,
    });
    setEditMode(false);
    setEditId(null);
  };

  return (
    <AdminLayout title="Source Address">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold theme-text-primary mb-6">
            {editMode ? "Edit Source Address" : "Add New Source Address"}
          </h1>
          
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
              className="mb-4"
            />
          )}
          
          {success && (
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess(null)}
              className="mb-4"
            />
          )}
          
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium theme-text-secondary mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium theme-text-secondary mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium theme-text-secondary mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium theme-text-secondary mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium theme-text-secondary mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium theme-text-secondary mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium theme-text-secondary mb-1">
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm theme-text-secondary">
                    Set as active source address (will be used for all orders)
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              {editMode && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border theme-border rounded-md text-sm font-medium theme-text-secondary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  Cancel
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {loading ? "Saving..." : editMode ? "Update Address" : "Add Address"}
              </button>
            </div>
          </form>
        </div>
        
        <div>
          <h2 className="text-xl font-bold theme-text-primary mb-4">Source Addresses</h2>
          
          {loading && !addresses.length ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center theme-text-secondary">
              No source addresses found. Add one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((address) => (
                <motion.div
                  key={address._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                    address.isActive ? "border-green-500" : "border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold theme-text-primary">
                      {address.name}
                    </h3>
                    {address.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="theme-text-secondary text-sm mb-4">
                    <p>{address.address}</p>
                    <p>
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p>{address.country}</p>
                    <p className="mt-2">Phone: {address.phone}</p>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEdit(address)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(address._id)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    
                    {!address.isActive && (
                      <button
                        onClick={() => handleSetActive(address._id)}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200 transition-colors"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SourceAddress;
