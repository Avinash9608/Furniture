// import React, { useState, useEffect } from "react";
// import { paymentRequestsAPI, paymentSettingsAPI } from "../utils/api";
// import { formatPrice } from "../utils/format";
// import Alert from "./Alert";

// const PaymentRequestForm = ({ orderId, amount, onSuccess }) => {
//   const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
//   const [notes, setNotes] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [paymentSettings, setPaymentSettings] = useState(null);
//   const [loadingSettings, setLoadingSettings] = useState(true);

//   // Fetch payment settings
//   useEffect(() => {
//     const fetchPaymentSettings = async () => {
//       try {
//         setLoadingSettings(true);
//         const response = await paymentSettingsAPI.get();
//         setPaymentSettings(response.data);
//       } catch (err) {
//         setError("Failed to load payment settings");
//       } finally {
//         setLoadingSettings(false);
//       }
//     };

//     fetchPaymentSettings();
//   }, []);

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       setError(null);

//       await paymentRequestsAPI.create({
//         orderId,
//         amount,
//         paymentMethod,
//         notes,
//       });

//       setSuccess("Payment request submitted successfully");
//       setNotes("");

//       if (onSuccess) {
//         onSuccess();
//       }
//     } catch (err) {
//       setError("Failed to submit payment request");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Clear alerts after 5 seconds
//   useEffect(() => {
//     if (success || error) {
//       const timer = setTimeout(() => {
//         setSuccess(null);
//         setError(null);
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [success, error]);

//   return (
//     <div className="bg-white rounded-lg shadow-md p-6">
//       <h2 className="text-xl font-semibold mb-4">Request Payment</h2>

//       {/* Alerts */}
//       {error && <Alert type="error" message={error} />}
//       {success && <Alert type="success" message={success} />}

//       {loadingSettings ? (
//         <p>Loading payment settings...</p>
//       ) : !paymentSettings ? (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
//           <p className="text-yellow-700">
//             Payment settings are not configured. Please contact the
//             administrator.
//           </p>
//         </div>
//       ) : (
//         <>
//           {/* Payment Account Information */}
//           <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
//             <h3 className="font-medium text-blue-800 mb-2">
//               Payment Account Details
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-blue-700">
//                   <span className="font-medium">Account Number:</span>{" "}
//                   {paymentSettings.accountNumber}
//                 </p>
//                 <p className="text-sm text-blue-700">
//                   <span className="font-medium">IFSC Code:</span>{" "}
//                   {paymentSettings.ifscCode}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-sm text-blue-700">
//                   <span className="font-medium">Account Holder:</span>{" "}
//                   {paymentSettings.accountHolder}
//                 </p>
//                 {paymentSettings.bankName && (
//                   <p className="text-sm text-blue-700">
//                     <span className="font-medium">Bank:</span>{" "}
//                     {paymentSettings.bankName}
//                   </p>
//                 )}
//               </div>
//             </div>
//             <div className="mt-3 text-sm text-blue-700">
//               <p className="font-medium">Instructions:</p>
//               <ol className="list-decimal ml-5 space-y-1">
//                 <li>Transfer {formatPrice(amount)} to the account above</li>
//                 <li>Submit the payment request form below</li>
//                 <li>Your payment will be verified and confirmed</li>
//               </ol>
//             </div>
//           </div>

//           {/* Payment Request Form */}
//           <form onSubmit={handleSubmit}>
//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Payment Method
//               </label>
//               <select
//                 value={paymentMethod}
//                 onChange={(e) => setPaymentMethod(e.target.value)}
//                 className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
//                 required
//               >
//                 <option value="bank_transfer">Bank Transfer</option>
//                 <option value="upi">UPI Payment</option>
//                 <option value="credit_card">Credit/Debit Card</option>
//                 <option value="paypal">PayPal</option>
//                 <option value="rupay">RuPay</option>
//               </select>
//             </div>

//             <div className="mb-4">
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Notes (Optional)
//               </label>
//               <textarea
//                 value={notes}
//                 onChange={(e) => setNotes(e.target.value)}
//                 className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
//                 rows="3"
//                 placeholder="Add any additional information about your payment"
//               ></textarea>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
//             >
//               {loading ? "Submitting..." : "Submit Payment Request"}
//             </button>
//           </form>
//         </>
//       )}
//     </div>
//   );
// };

// export default PaymentRequestForm;
import React, { useState, useEffect } from "react";
import { paymentRequestsAPI, paymentSettingsAPI } from "../utils/api";
import { formatPrice } from "../utils/format";
import Alert from "./Alert";

const PaymentRequestForm = ({ orderId, amount, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        setLoadingSettings(true);
        const response = await paymentSettingsAPI.get();
        setPaymentSettings(response.data);
      } catch (err) {
        setError("Failed to load payment settings");
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchPaymentSettings();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await paymentRequestsAPI.create({
        orderId,
        amount,
        paymentMethod,
        notes,
      });

      setSuccess("Payment request submitted successfully");
      setNotes("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError("Failed to submit payment request");
    } finally {
      setLoading(false);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Request Payment
      </h2>

      {/* Alerts */}
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {loadingSettings ? (
        <p className="text-gray-600 dark:text-gray-300">
          Loading payment settings...
        </p>
      ) : !paymentSettings ? (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 mb-4">
          <p className="text-yellow-700 dark:text-yellow-200">
            Payment settings are not configured. Please contact the
            administrator.
          </p>
        </div>
      ) : (
        <>
          {/* Payment Account Information */}
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-4 mb-6">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Payment Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Account Number:</span>{" "}
                  {paymentSettings.accountNumber}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">IFSC Code:</span>{" "}
                  {paymentSettings.ifscCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Account Holder:</span>{" "}
                  {paymentSettings.accountHolder}
                </p>
                {paymentSettings.bankName && (
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Bank:</span>{" "}
                    {paymentSettings.bankName}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Instructions:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Transfer {formatPrice(amount)} to the account above</li>
                <li>Submit the payment request form below</li>
                <li>Your payment will be verified and confirmed</li>
              </ol>
            </div>
          </div>

          {/* Payment Request Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-primary-dark dark:focus:border-primary-dark"
                required
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI Payment</option>
                <option value="credit_card">Credit/Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="rupay">RuPay</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-primary-dark dark:focus:border-primary-dark"
                rows="3"
                placeholder="Add any additional information about your payment"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary dark:bg-primary-dark text-white py-2 px-4 rounded-md hover:bg-primary-dark dark:hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-dark disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Payment Request"}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default PaymentRequestForm;
