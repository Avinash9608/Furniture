import React, { useState, useEffect } from "react";
import { paymentSettingsAPI } from "../utils/api";

const PaymentInstructions = ({ paymentMethod }) => {
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        setLoading(true);
        const response = await paymentSettingsAPI.get();
        setPaymentSettings(response.data);
      } catch (err) {
        console.error("Error fetching payment settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSettings();
  }, []);
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-blue-800">
          Order & Payment Instructions
        </h3>
      </div>

      <div className="text-sm text-blue-700 space-y-6">
        {/* Payment Account Details */}
        {paymentSettings &&
          (paymentMethod === "credit_card" ||
            paymentMethod === "upi" ||
            paymentMethod === "rupay") && (
            <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-100 mb-4">
              <h4 className="font-medium mb-3 flex items-center text-blue-800">
                <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </span>
                Payment Account Details
              </h4>
              <div className="ml-8 bg-white rounded-md p-3 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Account Number:</span>{" "}
                      {paymentSettings.accountNumber}
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">IFSC Code:</span>{" "}
                      {paymentSettings.ifscCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Account Holder:</span>{" "}
                      {paymentSettings.accountHolder}
                    </p>
                    {paymentSettings.bankName && (
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Bank:</span>{" "}
                        {paymentSettings.bankName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-sm text-blue-700">
                  <p className="font-medium">Important:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Make payment to the account above</li>
                    <li>
                      After payment, submit a payment request from your Orders
                      page
                    </li>
                    <li>Your payment will be verified and confirmed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-100">
          <h4 className="font-medium mb-3 flex items-center text-blue-800">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center mr-2">
              1
            </span>
            Choose a Payment Method
          </h4>

          {paymentMethod === "credit_card" && (
            <div className="ml-8 mb-3">
              <div className="flex items-center mb-2">
                <div className="bg-blue-100 p-1 rounded-full mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <p className="font-medium">Credit / Debit Card</p>
              </div>
              <div className="bg-white rounded-md p-3 border border-gray-100">
                <ul className="list-none space-y-2">
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      1
                    </span>
                    Enter your <strong className="mx-1">Name on Card</strong>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      2
                    </span>
                    Enter your <strong className="mx-1">Card Number</strong>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      3
                    </span>
                    Enter <strong className="mx-1">Expiry Date</strong> and{" "}
                    <strong className="mx-1">CVV</strong>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      4
                    </span>
                    Click on <strong className="mx-1">Place Order</strong> to
                    proceed
                  </li>
                </ul>
              </div>
            </div>
          )}

          {paymentMethod === "upi" && (
            <div className="ml-8 mb-3">
              <div className="flex items-center mb-2">
                <div className="bg-blue-100 p-1 rounded-full mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-blue-600"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                      fill="#097939"
                    />
                    <path
                      d="M10 14.24l1.74-4.92h1.24L11.24 14h2.32v.96H10v-.72z"
                      fill="#ffffff"
                    />
                    <path
                      d="M14.25 9.32h1.24L13.75 14h-1.24l1.74-4.68z"
                      fill="#ffffff"
                    />
                  </svg>
                </div>
                <p className="font-medium">UPI Payment</p>
              </div>
              <div className="bg-white rounded-md p-3 border border-gray-100">
                <ul className="list-none space-y-2">
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      1
                    </span>
                    Scan the <strong className="mx-1">QR Code</strong> with your
                    UPI app
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      2
                    </span>
                    Or enter your <strong className="mx-1">UPI ID</strong>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      3
                    </span>
                    Click on <strong className="mx-1">Place Order</strong> to
                    proceed
                  </li>
                </ul>
              </div>
            </div>
          )}

          {paymentMethod === "paypal" && (
            <div className="ml-8 mb-3">
              <div className="flex items-center mb-2">
                <div className="bg-blue-100 p-1 rounded-full mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="#003087"
                  >
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.384a.64.64 0 0 1 .632-.537h6.012c2.658 0 4.53.714 5.272 2.108.651 1.22.654 2.646.11 4.082-.52 1.377-1.501 2.53-2.896 3.428-1.357.872-3.035 1.316-4.99 1.316h-2.33c-.54 0-1.001.39-1.085.923l-1.243 6.646a.64.64 0 0 1-.632.537h-.718z" />
                    <path
                      d="M19.826 8.88c0 3.317-2.495 6.384-6.735 6.384h-2.512a.702.702 0 0 0-.694.623l-.891 5.624a.64.64 0 0 1-.631.538h-2.278a.332.332 0 0 1-.328-.384l.21-1.33 1.33-8.233a.64.64 0 0 1 .632-.537h4.276c4.24 0 7.736 3.067 7.736 6.384 0 0 0-9.069 0-9.069z"
                      fill="#009cde"
                    />
                  </svg>
                </div>
                <p className="font-medium">PayPal</p>
              </div>
              <div className="bg-white rounded-md p-3 border border-gray-100">
                <ul className="list-none space-y-2">
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      1
                    </span>
                    Click on <strong className="mx-1">Pay with PayPal</strong>{" "}
                    button
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      2
                    </span>
                    Log in to your{" "}
                    <strong className="mx-1">PayPal account</strong>
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      3
                    </span>
                    Confirm the payment
                  </li>
                </ul>
              </div>
            </div>
          )}

          {paymentMethod === "cod" && (
            <div className="ml-8 mb-3">
              <div className="flex items-center mb-2">
                <div className="bg-blue-100 p-1 rounded-full mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="font-medium">Cash on Delivery</p>
              </div>
              <div className="bg-white rounded-md p-3 border border-gray-100">
                <ul className="list-none space-y-2">
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      1
                    </span>
                    No payment required now
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      2
                    </span>
                    Click on <strong className="mx-1">Place Order</strong> to
                    confirm
                  </li>
                  <li className="flex items-center">
                    <span className="bg-blue-100 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2">
                      3
                    </span>
                    Pay when your order is delivered
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-100">
          <h4 className="font-medium mb-3 flex items-center text-blue-800">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center mr-2">
              2
            </span>
            Order Confirmation
          </h4>
          <p className="ml-8">
            Once the payment is confirmed (or selected as COD), your order will
            be <strong>successfully placed</strong>.
          </p>
        </div>

        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-100">
          <h4 className="font-medium mb-3 flex items-center text-blue-800">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center mr-2">
              3
            </span>
            My Orders (User Panel)
          </h4>
          <p className="ml-8 mb-2">
            In the <strong>My Orders</strong> section, you can:
          </p>
          <div className="ml-8 bg-white rounded-md p-3 border border-gray-100">
            <ul className="list-none space-y-2">
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                View your <strong className="mx-1">Order Details</strong>
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Track <strong className="mx-1">Delivery Status</strong> in
                real-time
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Check your <strong className="mx-1">Payment Status</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-100">
          <h4 className="font-medium mb-3 flex items-center text-blue-800">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center mr-2">
              4
            </span>
            Admin Panel – Order Management
          </h4>
          <p className="ml-8 mb-2">
            In the <strong>Admin Dashboard</strong>, you can:
          </p>
          <div className="ml-8 bg-white rounded-md p-3 border border-gray-100">
            <ul className="list-none space-y-2">
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                View all <strong className="mx-1">User Orders</strong>
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                See full{" "}
                <strong className="mx-1">Order and Payment Details</strong>
              </li>
              <li className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Manage and update the{" "}
                <strong className="mx-1">Order Delivery Status</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInstructions;
