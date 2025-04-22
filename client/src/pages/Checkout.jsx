import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ordersAPI, paymentSettingsAPI } from "../utils/api";
import { formatPrice } from "../utils/format";
import Alert from "../components/Alert";
import PaymentInstructions from "../components/PaymentInstructions";
// Uncomment these when you set up Stripe
// import { loadStripe } from '@stripe/stripe-js';
// import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentDetails, setPaymentDetails] = useState({
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    upiId: "",
    rupayId: "",
  });
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=checkout");
    } else if (cartItems.length === 0) {
      navigate("/cart");
    } else if (user) {
      // Pre-fill with user data if available
      setShippingInfo((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [isAuthenticated, cartItems, navigate, user]);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        setLoadingSettings(true);
        const response = await paymentSettingsAPI.get();
        setPaymentSettings(response.data);
      } catch (err) {
        console.error("Error fetching payment settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchPaymentSettings();
  }, []);

  // Calculate prices
  const itemsPrice = totalPrice;
  const shippingPrice = itemsPrice > 10000 ? 0 : 500;
  const taxPrice = Number((0.18 * itemsPrice).toFixed(2));
  const totalOrderPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2);

  // Payment methods
  const paymentMethods = [
    {
      id: "credit_card",
      name: "Credit/Debit Card",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
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
      ),
      brands: ["visa", "mastercard", "rupay", "amex"],
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="#003087"
        >
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.384a.64.64 0 0 1 .632-.537h6.012c2.658 0 4.53.714 5.272 2.108.651 1.22.654 2.646.11 4.082-.52 1.377-1.501 2.53-2.896 3.428-1.357.872-3.035 1.316-4.99 1.316h-2.33c-.54 0-1.001.39-1.085.923l-1.243 6.646a.64.64 0 0 1-.632.537h-.718z" />
          <path
            d="M19.826 8.88c0 3.317-2.495 6.384-6.735 6.384h-2.512a.702.702 0 0 0-.694.623l-.891 5.624a.64.64 0 0 1-.631.538h-2.278a.332.332 0 0 1-.328-.384l.21-1.33 1.33-8.233a.64.64 0 0 1 .632-.537h4.276c4.24 0 7.736 3.067 7.736 6.384 0 0 0-9.069 0-9.069z"
            fill="#009cde"
          />
        </svg>
      ),
    },
    {
      id: "upi",
      name: "UPI Payment",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
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
          <path d="M14.25 9.32h1.24L13.75 14h-1.24l1.74-4.68z" fill="#ffffff" />
        </svg>
      ),
      apps: ["Google Pay", "PhonePe", "Paytm", "BHIM"],
    },
    {
      id: "rupay",
      name: "RuPay",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 24 24"
        >
          <rect width="24" height="24" rx="2" fill="#097939" />
          <path
            d="M6 12h12M9 8l6 8M15 8l-6 8"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
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
      ),
    },
  ];

  // Handle payment details change
  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Validate payment form
  const validatePayment = () => {
    const newErrors = {};

    if (!paymentMethod) {
      newErrors.paymentMethod = "Payment method is required";
      setErrors(newErrors);
      return false;
    }

    if (paymentMethod === "credit_card") {
      if (!cardDetails.cardName)
        newErrors.cardName = "Name on card is required";
      if (!cardDetails.cardNumber)
        newErrors.cardNumber = "Card number is required";
      if (!cardDetails.expiryDate)
        newErrors.expiryDate = "Expiry date is required";
      if (!cardDetails.cvv) newErrors.cvv = "CVV is required";
    } else if (paymentMethod === "upi") {
      if (!paymentDetails.upiId) newErrors.upiId = "UPI ID is required";
      else if (!/^[\w.-]+@[\w]+$/.test(paymentDetails.upiId)) {
        newErrors.upiId = "Invalid UPI ID format";
      }
    } else if (paymentMethod === "rupay") {
      if (!paymentDetails.rupayId) newErrors.rupayId = "RuPay ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle shipping info change
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Validate shipping form
  const validateShipping = () => {
    const newErrors = {};
    if (!shippingInfo.name) newErrors.name = "Name is required";
    if (!shippingInfo.address) newErrors.address = "Address is required";
    if (!shippingInfo.city) newErrors.city = "City is required";
    if (!shippingInfo.state) newErrors.state = "State is required";
    if (!shippingInfo.postalCode)
      newErrors.postalCode = "Postal code is required";
    if (!shippingInfo.country) newErrors.country = "Country is required";
    if (!shippingInfo.phone) newErrors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(shippingInfo.phone))
      newErrors.phone = "Phone must be 10 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (step === 1 && !validateShipping()) return;
    if (step === 2 && !validatePayment()) return;
    setStep((prev) => prev + 1);
  };

  // Handle previous step
  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  // Process order
  const placeOrder = async () => {
    setIsProcessing(true);
    setErrors({});

    try {
      // Create order items from cart
      const orderItems = cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        price: item.price,
        product: item._id,
      }));

      // Create order data
      const orderData = {
        orderItems,
        shippingAddress: shippingInfo,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice: Number(totalOrderPrice),
      };

      // Process based on payment method
      let orderResponse;

      switch (paymentMethod) {
        case "credit_card":
          // In a real app, this would integrate with Stripe or another payment processor
          orderResponse = await processCreditCardPayment(orderData);
          break;
        case "paypal":
          // In a real app, this would redirect to PayPal
          orderResponse = await processPaypalPayment(orderData);
          break;
        case "upi":
          // In a real app, this would show a UPI QR code or payment details
          orderResponse = await processUPIPayment(orderData);
          break;
        case "rupay":
          // In a real app, this would integrate with RuPay payment gateway
          orderResponse = await processRupayPayment(orderData);
          break;
        case "cod":
          // Cash on delivery is the simplest flow
          orderResponse = await processCODPayment(orderData);
          break;
        default:
          throw new Error("Invalid payment method");
      }

      // Handle successful order creation
      setOrderId(orderResponse.data._id);
      setOrderSuccess(true);
      clearCart();
    } catch (error) {
      console.error("Order placement error:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          error.message ||
          "Failed to place order. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Process credit card payment (simulation)
  const processCreditCardPayment = async (orderData) => {
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create order with payment status
    return await ordersAPI.create({
      ...orderData,
      isPaid: true,
      paidAt: new Date().toISOString(),
      paymentResult: {
        id: "CARD_" + Date.now(),
        status: "completed",
        update_time: new Date().toISOString(),
        email_address: user.email,
      },
    });
  };

  // Process PayPal payment (simulation)
  const processPaypalPayment = async (orderData) => {
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create order with payment status
    return await ordersAPI.create({
      ...orderData,
      isPaid: true,
      paidAt: new Date().toISOString(),
      paymentResult: {
        id: "PAYPAL_" + Date.now(),
        status: "completed",
        update_time: new Date().toISOString(),
        email_address: user.email,
      },
    });
  };

  // Process UPI payment (simulation)
  const processUPIPayment = async (orderData) => {
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create order with pending payment status
    // UPI payments need admin verification, so they start as unpaid
    return await ordersAPI.create({
      ...orderData,
      isPaid: false, // Mark as unpaid until admin verifies
      paymentResult: {
        id: "UPI_" + Date.now(),
        status: "pending", // Set status as pending
        update_time: new Date().toISOString(),
        email_address: user.email,
      },
    });
  };

  // Process RuPay payment (simulation)
  const processRupayPayment = async (orderData) => {
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create order with pending payment status
    // RuPay payments need admin verification, so they start as unpaid
    return await ordersAPI.create({
      ...orderData,
      isPaid: false, // Mark as unpaid until admin verifies
      paymentResult: {
        id: "RUPAY_" + Date.now(),
        status: "pending", // Set status as pending
        update_time: new Date().toISOString(),
        email_address: user.email,
      },
    });
  };

  // Process Cash on Delivery (simulation)
  const processCODPayment = async (orderData) => {
    // Create order with COD status
    return await ordersAPI.create({
      ...orderData,
      isPaid: false,
      paymentResult: {
        id: "COD_" + Date.now(),
        status: "pending",
        update_time: new Date().toISOString(),
      },
    });
  };

  // Render shipping form
  const renderShippingForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Shipping Information</h2>

      {errors.submit && (
        <Alert
          type="error"
          message={errors.submit}
          onClose={() => setErrors((prev) => ({ ...prev, submit: null }))}
        />
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={shippingInfo.name}
            onChange={handleShippingChange}
            className={`w-full p-2 border rounded-md ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={shippingInfo.address}
            onChange={handleShippingChange}
            className={`w-full p-2 border rounded-md ${
              errors.address ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={shippingInfo.city}
              onChange={handleShippingChange}
              className={`w-full p-2 border rounded-md ${
                errors.city ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              name="state"
              value={shippingInfo.state}
              onChange={handleShippingChange}
              className={`w-full p-2 border rounded-md ${
                errors.state ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              type="text"
              name="postalCode"
              value={shippingInfo.postalCode}
              onChange={handleShippingChange}
              className={`w-full p-2 border rounded-md ${
                errors.postalCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={shippingInfo.country}
              onChange={handleShippingChange}
              className={`w-full p-2 border rounded-md ${
                errors.country ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-600">{errors.country}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="text"
            name="phone"
            value={shippingInfo.phone}
            onChange={handleShippingChange}
            className={`w-full p-2 border rounded-md ${
              errors.phone ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );

  // State for credit card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  // Handle card details change
  const handleCardDetailsChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Render payment method selection
  const renderPaymentMethod = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Payment Method</h2>

      {errors.payment && (
        <p className="mb-4 text-sm text-red-600">{errors.payment}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              paymentMethod === method.id
                ? "border-primary bg-primary bg-opacity-5 shadow-md transform -translate-y-1"
                : "border-gray-200 hover:border-gray-300 hover:shadow"
            }`}
            onClick={() => setPaymentMethod(method.id)}
          >
            <div className="flex items-center">
              <div
                className={`p-2 rounded-full ${
                  paymentMethod === method.id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {method.icon}
              </div>
              <div className="ml-3">
                <label
                  htmlFor={method.id}
                  className="block text-sm font-medium text-gray-700"
                >
                  {method.name}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {method.id === "credit_card" &&
                    "Pay securely with your credit or debit card"}
                  {method.id === "paypal" && "Pay via PayPal - fast and secure"}
                  {method.id === "upi" &&
                    "Pay using UPI apps like Google Pay, PhonePe, or Paytm"}
                  {method.id === "cod" && "Pay when you receive your order"}
                </p>
              </div>
            </div>

            {/* Display card brands for credit card */}
            {method.id === "credit_card" && method.brands && (
              <div className="mt-3 flex space-x-2">
                {method.brands.map((brand) => (
                  <div
                    key={brand}
                    className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-700 border border-gray-200"
                  >
                    {brand === "visa" && "Visa"}
                    {brand === "mastercard" && "MC"}
                    {brand === "rupay" && "RuPay"}
                    {brand === "amex" && "Amex"}
                  </div>
                ))}
              </div>
            )}

            {/* Display UPI apps */}
            {method.id === "upi" && method.apps && (
              <div className="mt-3 flex flex-wrap gap-2">
                {method.apps.map((app) => (
                  <div
                    key={app}
                    className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 border border-gray-200"
                  >
                    {app}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Credit Card Form */}
      {paymentMethod === "credit_card" && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-3">Enter Card Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.cardNumber}
                onChange={handleCardDetailsChange}
                className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                maxLength={19}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name on Card
              </label>
              <input
                type="text"
                name="cardName"
                placeholder="John Doe"
                value={cardDetails.cardName}
                onChange={handleCardDetailsChange}
                className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={cardDetails.expiryDate}
                  onChange={handleCardDetailsChange}
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={handleCardDetailsChange}
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPI Payment */}
      {paymentMethod === "upi" && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-3">UPI Payment</h3>
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <img
                src="https://via.placeholder.com/200x200?text=UPI+QR+Code"
                alt="UPI QR Code"
                className="w-48 h-48 object-cover"
              />
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Scan with any UPI app to pay
            </p>
            <div className="flex space-x-2 mb-4">
              {paymentMethods
                .find((m) => m.id === "upi")
                ?.apps.map((app) => (
                  <div
                    key={app}
                    className="p-1 rounded bg-white border border-gray-200 text-xs"
                  >
                    {app}
                  </div>
                ))}
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter UPI ID
              </label>
              <input
                type="text"
                name="upiId"
                placeholder="yourname@upi"
                value={paymentDetails.upiId}
                onChange={handlePaymentDetailsChange}
                className={`w-full p-2 border rounded-md focus:ring-primary focus:border-primary ${
                  errors.upiId ? "border-red-500" : ""
                }`}
              />
              {errors.upiId && (
                <p className="mt-1 text-sm text-red-600">{errors.upiId}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RuPay Payment */}
      {paymentMethod === "rupay" && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
          <h3 className="font-medium text-gray-700 mb-3">RuPay Card Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RuPay Card Number
              </label>
              <input
                type="text"
                name="rupayId"
                placeholder="1234 5678 9012 3456"
                value={paymentDetails.rupayId}
                onChange={handlePaymentDetailsChange}
                className={`w-full p-2 border rounded-md focus:ring-primary focus:border-primary ${
                  errors.rupayId ? "border-red-500" : ""
                }`}
                maxLength={19}
              />
              {errors.rupayId && (
                <p className="mt-1 text-sm text-red-600">{errors.rupayId}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name on Card
              </label>
              <input
                type="text"
                name="cardName"
                placeholder="John Doe"
                value={cardDetails.cardName}
                onChange={handleCardDetailsChange}
                className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  placeholder="MM/YY"
                  value={cardDetails.expiryDate}
                  onChange={handleCardDetailsChange}
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={handleCardDetailsChange}
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PayPal Payment */}
      {paymentMethod === "paypal" && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50 text-center">
          <div className="flex justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
              className="w-16 h-16 text-[#003087]"
              fill="currentColor"
            >
              <path d="M186.3 258.2c0 12.2-9.7 21.5-22 21.5-9.2 0-16-5.2-16-15 0-12.2 9.5-22 21.7-22 9.3 0 16.3 5.7 16.3 15.5zM80.5 209.7h-4.7c-1.5 0-3 1-3.2 2.7l-4.3 26.7 8.2-.3c11 0 19.5-1.5 21.5-14.2 2.3-13.4-6.2-14.9-17.5-14.9zm284 0H360c-1.8 0-3 1-3.2 2.7l-4.2 26.7 8-.3c13 0 22-3 22-18-.1-10.6-9.6-11.1-18.1-11.1zM576 80v352c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V80c0-26.5 21.5-48 48-48h480c26.5 0 48 21.5 48 48zM128.3 215.4c0-21-16.2-28-34.7-28h-40c-2.5 0-5 2-5.2 4.7L32 294.2c-.3 2 1.2 4 3.2 4h19c2.7 0 5.2-2.9 5.5-5.7l4.5-26.6c1-7.2 13.2-4.7 18-4.7 28.6 0 46.1-17 46.1-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.2 8.2-5.8-8.5-14.2-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9 0 20.2-4.9 26.5-11.9-.5 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H200c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm40.5 97.9l63.7-92.6c.5-.5.5-1 .5-1.7 0-1.7-1.5-3.5-3.2-3.5h-19.2c-1.7 0-3.5 1-4.5 2.5l-26.5 39-11-37.5c-.8-2.2-3-4-5.5-4h-18.7c-1.7 0-3.2 1.8-3.2 3.5 0 1.2 19.5 56.8 21.2 62.1-2.7 3.8-20.5 28.6-20.5 31.6 0 1.8 1.5 3.2 3.2 3.2h19.2c1.8-.1 3.5-1.1 4.5-2.6zm159.3-106.7c0-21-16.2-28-34.7-28h-39.7c-2.7 0-5.2 2-5.5 4.7l-16.2 102c-.2 2 1.3 4 3.2 4h20.5c2 0 3.5-1.5 4-3.2l4.5-29c1-7.2 13.2-4.7 18-4.7 28.4 0 45.9-17 45.9-45.8zm84.2 8.8h-19c-3.8 0-4 5.5-4.3 8.2-5.5-8.5-14-10-23.7-10-24.5 0-43.2 21.5-43.2 45.2 0 19.5 12.2 32.2 31.7 32.2 9.3 0 20.5-4.9 26.5-11.9-.3 1.5-1 4.7-1 6.2 0 2.3 1 4 3.2 4H484c2.7 0 5-2.9 5.5-5.7l10.2-64.3c.3-1.9-1.2-3.9-3.2-3.9zm47.5-33.3c0-2-1.5-3.5-3.2-3.5h-18.5c-1.5 0-3 1.2-3.2 2.7l-16.2 104-.3.5c0 1.8 1.5 3.5 3.5 3.5h16.5c2.5 0 5-2.9 5.2-5.7L544 191.2v-.3zm-90 51.8c-12.2 0-21.7 9.7-21.7 22 0 9.7 7 15 16.2 15 12 0 21.7-9.2 21.7-21.5.1-9.8-6.9-15.5-16.2-15.5z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Click the button below to pay with PayPal
          </p>
          <button className="bg-[#0070ba] text-white py-2 px-4 rounded-md hover:bg-[#003087] transition-colors">
            Pay with PayPal
          </button>
        </div>
      )}

      {/* Payment Instructions */}
      <PaymentInstructions paymentMethod={paymentMethod} />
    </div>
  );

  // Render order summary
  const renderOrderSummary = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      <div className="border-b pb-4 mb-4">
        <h3 className="font-medium mb-2">Shipping To</h3>
        <p className="text-gray-600">
          {shippingInfo.name}
          <br />
          {shippingInfo.address}
          <br />
          {shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}
          <br />
          {shippingInfo.country}
          <br />
          Phone: {shippingInfo.phone}
        </p>
      </div>

      <div className="border-b pb-4 mb-4">
        <h3 className="font-medium mb-2">Payment Method</h3>
        <p className="text-gray-600">
          {paymentMethods.find((m) => m.id === paymentMethod)?.name ||
            "Not selected"}
        </p>
      </div>

      <div className="border-b pb-4 mb-4">
        <h3 className="font-medium mb-2">Order Items</h3>
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item._id} className="flex justify-between items-center">
              <div className="flex items-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md mr-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/300x300?text=Image+Not+Found";
                  }}
                />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-medium">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatPrice(itemsPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span>
            {shippingPrice === 0 ? "Free" : formatPrice(shippingPrice)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax (18% GST)</span>
          <span>{formatPrice(taxPrice)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span className="text-primary">
            {formatPrice(Number(totalOrderPrice))}
          </span>
        </div>
      </div>
    </div>
  );

  // Render success message
  const renderSuccess = () => (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Thank You For Your Order!
      </h2>
      <p className="text-gray-600 mb-6">
        Your order has been placed successfully.
        <br />
        Order ID: <span className="font-medium">{orderId}</span>
      </p>

      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6 text-left">
        <h3 className="font-medium text-gray-800 mb-3 text-lg">
          Order Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Shipping Address</h4>
            <p className="text-sm text-gray-600">
              {shippingInfo.name}
              <br />
              {shippingInfo.address}
              <br />
              {shippingInfo.city}, {shippingInfo.state}{" "}
              {shippingInfo.postalCode}
              <br />
              {shippingInfo.country}
              <br />
              Phone: {shippingInfo.phone}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              Payment Information
            </h4>
            <p className="text-sm text-gray-600">
              <span className="block">
                Method:{" "}
                {paymentMethods.find((m) => m.id === paymentMethod)?.name}
              </span>
              <span className="block">
                Status:{" "}
                {paymentMethod === "cod" ? "Pending (Pay on delivery)" : "Paid"}
              </span>
              <span className="block">
                Total: {formatPrice(Number(totalOrderPrice))}
              </span>
            </p>
          </div>
        </div>
      </div>

      {paymentMethod === "cod" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 text-left">
          <h3 className="font-medium text-yellow-800 mb-1">Cash on Delivery</h3>
          <p className="text-sm text-yellow-700">
            Your order will be delivered within 5-7 business days. Please keep
            the exact amount ready for payment upon delivery.
          </p>
        </div>
      )}

      {(paymentMethod === "credit_card" ||
        paymentMethod === "paypal" ||
        paymentMethod === "rupay") && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 text-left">
          <h3 className="font-medium text-green-800 mb-1">
            Payment Successful
          </h3>
          <p className="text-sm text-green-700">
            Your payment has been processed successfully. You will receive a
            confirmation email shortly.
          </p>
        </div>
      )}

      {paymentMethod === "upi" && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-left">
          <h3 className="font-medium text-blue-800 mb-1">UPI Payment</h3>
          <p className="text-sm text-blue-700">
            Your UPI payment has been processed. You will receive a confirmation
            from your UPI app shortly.
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 text-left">
        <h3 className="font-medium text-blue-800 mb-1">
          👤 My Orders (User Panel)
        </h3>
        <p className="text-sm text-blue-700">
          In the <strong>My Orders</strong> section, you can:
        </p>
        <ul className="list-disc ml-5 mt-1 space-y-1 text-sm text-blue-700">
          <li>
            View your <strong>Order Details</strong>
          </li>
          <li>
            Track <strong>Delivery Status</strong> in real-time
          </li>
          <li>
            Check your <strong>Payment Status</strong>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button onClick={() => navigate("/orders")} className="btn-primary">
          View My Orders
        </button>
        <button onClick={() => navigate("/products")} className="btn-secondary">
          Continue Shopping
        </button>
      </div>
    </div>
  );

  // Render checkout steps indicator
  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {["Shipping", "Payment", "Review"].map((label, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  step > index + 1
                    ? "bg-green-500"
                    : step === index + 1
                    ? "bg-primary"
                    : "bg-gray-200"
                } text-white font-medium`}
              >
                {step > index + 1 ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-2 text-sm ${
                  step === index + 1
                    ? "font-medium text-primary"
                    : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>

            {index < 2 && (
              <div
                className={`w-24 h-1 ${
                  step > index + 1 ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-serif font-bold mb-6">Checkout</h1>

        {orderSuccess ? (
          renderSuccess()
        ) : (
          <>
            {renderStepIndicator()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {step === 1 && renderShippingForm()}
                {step === 2 && renderPaymentMethod()}
                {step === 3 && renderOrderSummary()}

                <div className="flex justify-between mt-4">
                  {step > 1 && (
                    <button onClick={handleBack} className="btn-secondary">
                      Back
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      onClick={handleNext}
                      className="btn-primary ml-auto"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={placeOrder}
                      disabled={isProcessing}
                      className="btn-primary ml-auto"
                    >
                      {isProcessing ? "Processing..." : "Place Order"}
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                  <h2 className="text-lg font-bold mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-4">
                    {cartItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.name} (x{item.quantity})
                        </span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatPrice(itemsPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span>
                        {shippingPrice === 0
                          ? "Free"
                          : formatPrice(shippingPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (18% GST)</span>
                      <span>{formatPrice(taxPrice)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatPrice(Number(totalOrderPrice))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Checkout;
