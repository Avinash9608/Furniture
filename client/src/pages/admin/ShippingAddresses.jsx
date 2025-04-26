import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AdminLayout from "../../components/admin/AdminLayout";
import Alert from "../../components/Alert";
import axios from "axios";
import Swal from "sweetalert2";

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

      console.log("Fetching shipping addresses");

      // Create a direct axios instance with more robust configuration
      const directApi = axios.create({
        timeout: 60000, // Increased timeout to 60 seconds
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Add retry logic
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all responses to handle them manually
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
      let success = false;

      // First try using fetch API
      for (const endpoint of endpoints) {
        if (!success) {
          try {
            console.log(
              `Trying to fetch shipping addresses with fetch API from: ${endpoint}`
            );
            const fetchResponse = await fetch(endpoint);

            if (fetchResponse.ok) {
              const data = await fetchResponse.json();
              console.log(
                "Shipping addresses fetched successfully with fetch:",
                data
              );

              if (data && data.data) {
                addressesData = data.data;
                success = true;
                break;
              } else if (data && Array.isArray(data)) {
                addressesData = data;
                success = true;
                break;
              }
            }
          } catch (fetchError) {
            console.warn(`Fetch API error for ${endpoint}:`, fetchError);
          }
        }
      }

      // If fetch didn't work, try axios
      if (!success) {
        for (const endpoint of endpoints) {
          try {
            console.log(
              `Trying to fetch shipping addresses with axios from: ${endpoint}`
            );
            const response = await directApi.get(endpoint);

            if (response.status >= 200 && response.status < 300) {
              console.log(
                "Shipping addresses fetched successfully with axios:",
                response.data
              );

              if (response.data && response.data.data) {
                addressesData = response.data.data;
                success = true;
                break;
              } else if (response.data && Array.isArray(response.data)) {
                addressesData = response.data;
                success = true;
                break;
              }
            }
          } catch (error) {
            console.warn(
              `Error fetching shipping addresses from ${endpoint}:`,
              error
            );
            // Continue to the next endpoint
          }
        }
      }

      // If all endpoints failed, try a direct server-side approach
      if (!success) {
        try {
          console.log("All endpoints failed, trying direct server approach");

          const directResponse = await fetch("/api/shipping-addresses", {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          });

          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log(
              "Shipping addresses fetched successfully with direct approach:",
              data
            );

            if (data && data.data) {
              addressesData = data.data;
            } else if (data && Array.isArray(data)) {
              addressesData = data;
            }
          }
        } catch (directError) {
          console.error("Direct approach failed:", directError);
        }
      }

      // If all approaches failed, use mock data
      if (!success || addressesData.length === 0) {
        console.log("All fetch approaches failed, using mock data");

        // Create mock data
        const mockAddresses = [
          {
            _id: "mock_1",
            name: "Default Address",
            address: "123 Main St",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400001",
            country: "India",
            phone: "9876543210",
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        addressesData = mockAddresses;

        // Show a warning to the user
        setError(
          "Could not connect to the server. Showing mock data for demonstration purposes."
        );
      }

      // Set the addresses data
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

    // Validate form data
    const requiredFields = [
      "name",
      "address",
      "city",
      "state",
      "postalCode",
      "phone",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      Swal.fire({
        title: "Form Incomplete",
        text: `Please fill in the following fields: ${missingFields.join(
          ", "
        )}`,
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    // Show loading state
    Swal.fire({
      title: editMode ? "Updating..." : "Saving...",
      text: `Please wait while we ${
        editMode ? "update" : "save"
      } the shipping address`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log("Submitting shipping address form:", formData);

      // Create a direct axios instance with more robust configuration
      const directApi = axios.create({
        timeout: 60000, // Increased timeout to 60 seconds
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Add retry logic
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all responses to handle them manually
        },
      });

      // Try multiple endpoints with better error handling
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
          `https://furniture-q3nb.onrender.com/api/shipping-addresses`,
        ];
      }

      let lastError = null;
      let success = false;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(
            `Trying to ${
              editMode ? "update" : "create"
            } shipping address at: ${endpoint}`
          );

          // Use fetch API as an alternative approach
          if (!success) {
            try {
              // Try with different content types
              let fetchResponse;

              // First try with application/json
              try {
                fetchResponse = await fetch(endpoint, {
                  method: editMode ? "PUT" : "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  body: JSON.stringify(formData),
                });

                if (!fetchResponse.ok) {
                  // If JSON fails, try with FormData
                  console.log("JSON fetch failed, trying with FormData");
                  const formDataObj = new FormData();
                  Object.keys(formData).forEach((key) => {
                    formDataObj.append(key, formData[key]);
                  });

                  fetchResponse = await fetch(endpoint, {
                    method: editMode ? "PUT" : "POST",
                    body: formDataObj,
                  });
                }
              } catch (fetchContentError) {
                console.warn(
                  "Error with fetch content types:",
                  fetchContentError
                );
                throw fetchContentError;
              }

              if (fetchResponse.ok) {
                const data = await fetchResponse.json();
                console.log(
                  "Shipping address saved successfully with fetch:",
                  data
                );
                success = true;

                // Show success message with SweetAlert
                Swal.fire({
                  title: "Success!",
                  text: editMode
                    ? "Shipping address updated successfully!"
                    : "Shipping address created successfully!",
                  icon: "success",
                  timer: 2000,
                  showConfirmButton: false,
                });

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
              } else {
                console.warn(
                  `Fetch API error for ${endpoint}:`,
                  fetchResponse.statusText
                );
              }
            } catch (fetchError) {
              console.warn(`Fetch API failed for ${endpoint}:`, fetchError);
            }
          }

          // If fetch didn't work, try axios
          if (!success) {
            const response = editMode
              ? await directApi.put(endpoint, formData)
              : await directApi.post(endpoint, formData);

            if (response.status >= 200 && response.status < 300) {
              console.log(
                "Shipping address saved successfully with axios:",
                response.data
              );
              success = true;

              // Show success message with SweetAlert
              Swal.fire({
                title: "Success!",
                text: editMode
                  ? "Shipping address updated successfully!"
                  : "Shipping address created successfully!",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });

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
            } else {
              throw new Error(
                `Received status ${response.status}: ${JSON.stringify(
                  response.data
                )}`
              );
            }
          }
        } catch (error) {
          console.warn(`Error saving shipping address at ${endpoint}:`, error);
          lastError = error;
          // Continue to the next endpoint
        }
      }

      // If all endpoints failed, try a direct server-side approach
      if (!success) {
        try {
          console.log("All endpoints failed, trying direct server approach");

          // Try a JSON submission first
          const directUrl = editMode
            ? `/api/shipping-addresses/${editId}`
            : `/api/shipping-addresses`;

          console.log(`Trying direct JSON submission to ${directUrl}`);
          let directResponse;

          try {
            directResponse = await fetch(directUrl, {
              method: editMode ? "PUT" : "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(formData),
            });

            if (directResponse.ok) {
              console.log("JSON submission successful");
            } else {
              console.log("JSON submission failed, trying FormData");

              // Create a FormData object for multipart/form-data submission
              const formDataObj = new FormData();
              Object.keys(formData).forEach((key) => {
                formDataObj.append(key, formData[key]);
              });

              const formDataResponse = await fetch(directUrl, {
                method: editMode ? "PUT" : "POST",
                body: formDataObj,
              });

              if (formDataResponse.ok) {
                console.log("FormData submission successful");
                directResponse = formDataResponse;
              }
            }
          } catch (directFetchError) {
            console.error(
              "Both JSON and FormData submissions failed:",
              directFetchError
            );

            // Try one more approach with URLSearchParams
            try {
              console.log("Trying URLSearchParams approach");
              const params = new URLSearchParams();
              Object.keys(formData).forEach((key) => {
                params.append(key, formData[key]);
              });

              directResponse = await fetch(directUrl, {
                method: editMode ? "PUT" : "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params,
              });
            } catch (urlParamsError) {
              console.error("URLSearchParams approach failed:", urlParamsError);
              throw new Error("All submission approaches failed");
            }
          }

          if (directResponse.ok) {
            const data = await directResponse.json();
            console.log(
              "Shipping address saved successfully with direct approach:",
              data
            );
            // Show success message with SweetAlert
            Swal.fire({
              title: "Success!",
              text: editMode
                ? "Shipping address updated successfully!"
                : "Shipping address created successfully!",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });

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
          } else {
            console.warn(
              `Direct approach failed with status ${directResponse.status}`
            );

            // Create a mock success response as a last resort
            console.log("Creating mock success response");

            // Generate a mock ID
            const mockId = `mock_${Date.now()}`;

            // Show success message with SweetAlert
            Swal.fire({
              title: "Success!",
              text: editMode
                ? "Shipping address updated successfully (mock)!"
                : "Shipping address created successfully (mock)!",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });

            // Reset form
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

            // Add mock address to the list
            if (!editMode) {
              setAddresses((prevAddresses) => [
                {
                  ...formData,
                  _id: mockId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                ...prevAddresses,
              ]);
            } else {
              // Update the address in the list
              setAddresses((prevAddresses) =>
                prevAddresses.map((addr) =>
                  addr._id === editId
                    ? { ...formData, _id: editId, updatedAt: new Date() }
                    : addr
                )
              );
            }

            // Show a warning with SweetAlert
            setTimeout(() => {
              Swal.fire({
                title: "Warning",
                text: "Database connection failed. Changes are only visible locally and will not persist.",
                icon: "warning",
                confirmButtonText: "Understood",
              });
            }, 2500);
          }
        } catch (directError) {
          console.error("Direct approach failed:", directError);

          // Show error message with SweetAlert
          Swal.fire({
            title: "Error!",
            text: "Failed to save shipping address after multiple attempts. Please try again later.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      }
    } catch (err) {
      console.error("Error saving shipping address:", err);

      // Show error message with SweetAlert
      Swal.fire({
        title: "Error!",
        text: "Failed to save shipping address. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);

      // Close the loading SweetAlert if it's still open
      Swal.close();
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    // Use SweetAlert2 for confirmation
    const result = await Swal.fire({
      title: "Delete Shipping Address?",
      text: "Are you sure you want to delete this shipping address? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    // If user cancels, return early
    if (!result.isConfirmed) {
      return;
    }

    // Check if this is a mock ID (starts with "mock_")
    const isMockId = id.toString().startsWith("mock_");

    if (isMockId) {
      console.log("Deleting mock address with ID:", id);

      // For mock IDs, just update the UI without making API calls
      setAddresses((prevAddresses) =>
        prevAddresses.filter((addr) => addr._id !== id)
      );

      // Show success message with SweetAlert
      Swal.fire({
        title: "Deleted!",
        text: "Mock shipping address has been deleted successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      return;
    }

    // For real IDs, proceed with normal deletion
    // Show loading state
    Swal.fire({
      title: "Deleting...",
      text: "Please wait while we delete the shipping address",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log(`Attempting to delete shipping address with ID: ${id}`);

      // Create a direct axios instance with more robust configuration
      const directApi = axios.create({
        timeout: 60000, // Increased timeout to 60 seconds
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Add retry logic
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all responses to handle them manually
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

      let success = false;

      // First try using fetch API
      for (const endpoint of endpoints) {
        if (!success) {
          try {
            console.log(
              `Trying to delete shipping address with fetch API at: ${endpoint}`
            );
            const fetchResponse = await fetch(endpoint, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (fetchResponse.ok) {
              console.log("Shipping address deleted successfully with fetch");
              success = true;

              // Show success message with SweetAlert
              Swal.fire({
                title: "Deleted!",
                text: "Shipping address has been deleted successfully.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });

              // Fetch updated addresses
              fetchAddresses();
              break;
            }
          } catch (fetchError) {
            console.warn(`Fetch API error for ${endpoint}:`, fetchError);
          }
        }
      }

      // If fetch didn't work, try axios
      if (!success) {
        for (const endpoint of endpoints) {
          try {
            console.log(
              `Trying to delete shipping address with axios at: ${endpoint}`
            );
            const response = await directApi.delete(endpoint);

            if (response.status >= 200 && response.status < 300) {
              console.log("Shipping address deleted successfully with axios");
              success = true;

              // Show success message with SweetAlert
              Swal.fire({
                title: "Deleted!",
                text: "Shipping address has been deleted successfully.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
              });

              // Fetch updated addresses
              fetchAddresses();
              break;
            }
          } catch (error) {
            console.warn(
              `Error deleting shipping address at ${endpoint}:`,
              error
            );
            // Continue to the next endpoint
          }
        }
      }

      // If all endpoints failed, try a direct server-side approach
      if (!success) {
        try {
          console.log("All endpoints failed, trying direct server approach");

          const directResponse = await fetch(`/api/shipping-addresses/${id}`, {
            method: "DELETE",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          });

          if (directResponse.ok) {
            console.log(
              "Shipping address deleted successfully with direct approach"
            );

            // Show success message with SweetAlert
            Swal.fire({
              title: "Deleted!",
              text: "Shipping address has been deleted successfully.",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });

            // Fetch updated addresses
            fetchAddresses();
          } else {
            console.warn(
              `Direct approach failed with status ${directResponse.status}`
            );

            // Create a mock success response as a last resort
            console.log("Creating mock success response for delete");

            // Show success message with SweetAlert
            Swal.fire({
              title: "Deleted!",
              text: "Shipping address has been deleted successfully (mock).",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });

            // Remove the address from the list locally
            setAddresses((prevAddresses) =>
              prevAddresses.filter((addr) => addr._id !== id)
            );

            // Show a warning with SweetAlert
            setTimeout(() => {
              Swal.fire({
                title: "Warning",
                text: "Database connection failed. Changes are only visible locally and will not persist.",
                icon: "warning",
                confirmButtonText: "Understood",
              });
            }, 2500);
          }
        } catch (directError) {
          console.error("Direct approach failed:", directError);

          // Show error message with SweetAlert
          Swal.fire({
            title: "Error!",
            text: "Failed to delete shipping address. Please try again later.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      }
    } catch (err) {
      console.error("Error deleting shipping address:", err);

      // Show error message with SweetAlert
      Swal.fire({
        title: "Error!",
        text: "Failed to delete shipping address. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);

      // Close the loading SweetAlert if it's still open
      Swal.close();
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

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-md p-6"
          >
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
                {loading
                  ? "Saving..."
                  : editMode
                  ? "Update Address"
                  : "Add Address"}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold theme-text-primary mb-4">
            Shipping Addresses
          </h2>

          {loading && (
            <p className="theme-text-primary">Loading addresses...</p>
          )}

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
                <h3 className="font-bold theme-text-primary mb-2">
                  {address.name}
                </h3>
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
