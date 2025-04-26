import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminLayout from "../../components/admin/AdminLayout";
import Alert from "../../components/Alert";
import axios from "axios";

const ShippingAddresses = () => {
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
    isDefault: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fetch shipping addresses
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
        `${baseUrl}/api/shipping-addresses`,
        `${baseUrl}/shipping-addresses`,
        `${baseUrl}/api/api/shipping-addresses`,
        "https://furniture-q3nb.onrender.com/api/shipping-addresses",
      ];
      
      let addressesData = [];
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch shipping addresses from: ${endpoint}`);
          const response = await directApi.get(endpoint);
          console.log("Shipping addresses fetched successfully:", response.data);
          
          if (response.data && response.data.data) {
            addressesData = response.data.data;
            break;
          } else if (response.data && Array.isArray(response.data)) {
            addressesData = response.data;
            break;
          }
        } catch (error) {
          console.warn(`Error fetching shipping addresses from ${endpoint}:`, error);
          // Continue to the next endpoint
        }
      }
      
      setAddresses(addressesData);
    } catch (err) {
      console.error("Error fetching shipping addresses:", err);
      setError("Failed to load shipping addresses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

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
          `${baseUrl}/api/shipping-addresses/${editId}`,
          `${baseUrl}/shipping-addresses/${editId}`,
          `${baseUrl}/api/api/shipping-addresses/${editId}`,
          `https://furniture-q3nb.onrender.com/api/shipping-addresses/${editId}`,
        ];
      } else {
        endpoints = [
          `${baseUrl}/api/shipping-addresses`,
          `${baseUrl}/shipping-addresses`,
          `${baseUrl}/api/api/shipping-addresses`,
          "https://furniture-q3nb.onrender.com/api/shipping-addresses",
        ];
      }
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to ${editMode ? 'update' : 'create'} shipping address at: ${endpoint}`);
          const response = editMode
            ? await directApi.put(endpoint, formData)
            : await directApi.post(endpoint, formData);
          
          console.log("Shipping address saved successfully:", response.data);
          setSuccess(editMode ? "Shipping address updated successfully!" : "Shipping address created successfully!");
          
          // Reset form and fetch updated addresses
          setFormData({
            name: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "India",
            phone: "",
            isDefault: false,
          });
          setEditMode(false);
          setEditId(null);
          fetchAddresses();
          break;
        } catch (error) {
          console.warn(`Error saving shipping address at ${endpoint}:`, error);
          // Continue to the next endpoint
        }
      }
    } catch (err) {
      console.error("Error saving shipping address:", err);
      setError("Failed to save shipping address. Please try again later.");
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
      isDefault: address.isDefault,
    });
    setEditMode(true);
    setEditId(address._id);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shipping address?")) {
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
        `${baseUrl}/api/shipping-addresses/${id}`,
        `${baseUrl}/shipping-addresses/${id}`,
        `${baseUrl}/api/api/shipping-addresses/${id}`,
        `https://furniture-q3nb.onrender.com/api/shipping-addresses/${id}`,
      ];
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to delete shipping address at: ${endpoint}`);
          await directApi.delete(endpoint);
          
          console.log("Shipping address deleted successfully");
          setSuccess("Shipping address deleted successfully!");
          
          // Fetch updated addresses
          fetchAddresses();
          break;
        } catch (error) {
          console.warn(`Error deleting shipping address at ${endpoint}:`, error);
          // Continue to the next endpoint
        }
      }
    } catch (err) {
      console.error("Error deleting shipping address:", err);
      setError("Failed to delete shipping address. Please try again later.");
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
      isDefault: false,
    });
    setEditMode(false);
    setEditId(null);
  };

  return (
    <AdminLayout title="Shipping Addresses">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold theme-text-primary mb-6">
            {editMode ? "Edit Shipping Address" : "Add New Shipping Address"}
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
                <label className="block text-sm font-medium theme-text-primary mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border theme-border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border theme-border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium theme-text-primary mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border theme-border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border theme-border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border theme-border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border theme-border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium theme-text-primary mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border theme-border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm theme-text-primary">
                    Set as default shipping address
                  </span>
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-4">
              {editMode && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border theme-border rounded-md text-sm font-medium theme-text-primary hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {loading ? "Saving..." : editMode ? "Update Address" : "Add Address"}
              </button>
            </div>
          </form>
        </div>
        
        <div>
          <h2 className="text-xl font-bold theme-text-primary mb-4">
            Shipping Addresses
          </h2>
          
          {loading && <p className="theme-text-primary">Loading addresses...</p>}
          
          {!loading && addresses.length === 0 && (
            <p className="theme-text-primary">No shipping addresses found.</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <motion.div
                key={address._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6 relative"
              >
                {address.isDefault && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Default
                  </span>
                )}
                <h3 className="font-bold theme-text-primary mb-2">{address.name}</h3>
                <p className="theme-text-secondary mb-1">{address.phone}</p>
                <p className="theme-text-secondary mb-1">{address.address}</p>
                <p className="theme-text-secondary mb-1">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="theme-text-secondary mb-4">{address.country}</p>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShippingAddresses;
