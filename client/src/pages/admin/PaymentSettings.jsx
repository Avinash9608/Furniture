import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { paymentSettingsAPI } from "../../utils/api";
import Alert from "../../components/Alert";

const PaymentSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    accountNumber: "",
    ifscCode: "",
    accountHolder: "",
    bankName: "",
    branchName: "",
    isActive: true,
  });
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Fetch payment settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log("Fetching payment settings...");
      const response = await paymentSettingsAPI.getAll();
      console.log("Payment settings response:", response);
      if (response && response.data) {
        setSettings(response.data);
      } else {
        setError("Invalid response format from server");
        console.error("Invalid response format:", response);
      }
    } catch (err) {
      console.error("Error fetching payment settings:", err);
      setError(
        err.response?.data?.message || "Failed to load payment settings"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
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
      console.log("Submitting payment settings form:", formData);

      if (editMode) {
        console.log(`Updating payment setting with ID: ${currentId}`);
        const response = await paymentSettingsAPI.update(currentId, formData);
        console.log("Update response:", response);
        setSuccess("Payment settings updated successfully");
      } else {
        console.log("Creating new payment setting");
        const response = await paymentSettingsAPI.create(formData);
        console.log("Create response:", response);
        setSuccess("Payment settings created successfully");
      }

      // Reset form and fetch updated settings
      setFormData({
        accountNumber: "",
        ifscCode: "",
        accountHolder: "",
        bankName: "",
        branchName: "",
        isActive: true,
      });
      setEditMode(false);
      setCurrentId(null);
      fetchSettings();
    } catch (err) {
      console.error("Error saving payment settings:", err);
      setError(
        err.response?.data?.message || "Failed to save payment settings"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (setting) => {
    setFormData({
      accountNumber: setting.accountNumber,
      ifscCode: setting.ifscCode,
      accountHolder: setting.accountHolder,
      bankName: setting.bankName || "",
      branchName: setting.branchName || "",
      isActive: setting.isActive,
    });
    setEditMode(true);
    setCurrentId(setting._id);
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this payment setting?")
    ) {
      try {
        setLoading(true);
        await paymentSettingsAPI.delete(id);
        setSuccess("Payment setting deleted successfully");
        fetchSettings();
      } catch (err) {
        setError("Failed to delete payment setting");
      } finally {
        setLoading(false);
      }
    }
  };

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <AdminLayout title="Payment Settings">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payment Settings</h1>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Payment Settings Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editMode ? "Edit Payment Setting" : "Add New Payment Setting"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number*
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code*
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name*
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Set as Active Payment Account
                </label>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading
                  ? "Saving..."
                  : editMode
                  ? "Update Setting"
                  : "Add Setting"}
              </button>
              {editMode && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      accountNumber: "",
                      ifscCode: "",
                      accountHolder: "",
                      bankName: "",
                      branchName: "",
                      isActive: true,
                    });
                    setEditMode(false);
                    setCurrentId(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Payment Settings List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Settings List</h2>
          {loading && <p>Loading...</p>}
          {!loading && settings.length === 0 && (
            <p className="text-gray-500">No payment settings found.</p>
          )}
          {!loading && settings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Holder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IFSC Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settings.map((setting) => (
                    <tr key={setting._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {setting.accountHolder}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {setting.accountNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {setting.ifscCode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {setting.bankName || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            setting.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {setting.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(setting)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(setting._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PaymentSettings;
