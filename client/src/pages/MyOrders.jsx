// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { ordersAPI } from "../utils/api";
// import { formatPrice } from "../utils/format";
// import { useAuth } from "../context/AuthContext";
// import PaymentRequestForm from "../components/PaymentRequestForm";
// import Alert from "../components/Alert";

// const MyOrders = () => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { user } = useAuth();

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const response = await ordersAPI.getMyOrders();

//         if (!response || !response.data) {
//           throw new Error("No data received from API");
//         }

//         // Handle different possible response structures
//         let fetchedOrders = [];

//         if (Array.isArray(response.data)) {
//           fetchedOrders = response.data;
//         } else if (response.data.data && Array.isArray(response.data.data)) {
//           fetchedOrders = response.data.data;
//         } else if (
//           response.data.orders &&
//           Array.isArray(response.data.orders)
//         ) {
//           fetchedOrders = response.data.orders;
//         } else {
//           throw new Error("Unexpected API response format");
//         }

//         setOrders(fetchedOrders);
//       } catch (err) {
//         console.error("Error fetching orders:", err);
//         setError(
//           err.message || "Failed to load orders. Please try again later."
//         );
//         setOrders([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrders();
//   }, [user]);

//   const getStatusColor = (status) => {
//     switch (status.toLowerCase()) {
//       case "processing":
//         return "bg-yellow-100 text-yellow-800";
//       case "shipped":
//         return "bg-blue-100 text-blue-800";
//       case "delivered":
//         return "bg-green-100 text-green-800";
//       case "cancelled":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getPaymentStatusColor = (isPaid) => {
//     return isPaid
//       ? "bg-green-100 text-green-800"
//       : "bg-yellow-100 text-yellow-800";
//   };

//   if (loading) {
//     return (
//       <div className="container-custom py-8">
//         <div className="flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="container-custom py-8">
//         <Alert variant="danger">
//           <strong>Error!</strong> {error}
//         </Alert>
//       </div>
//     );
//   }

//   return (
//     <div className="theme-bg-secondary py-8">
//       <div className="container-custom">
//         <h1 className="text-3xl font-serif font-bold mb-6">My Orders</h1>

//         {orders.length === 0 ? (
//           <div className="bg-white rounded-lg shadow-md p-8 text-center">
//             <div className="text-gray-500 mb-4">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-16 w-16 mx-auto text-gray-400"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
//                 />
//               </svg>
//             </div>
//             <h2 className="text-xl font-medium text-gray-900 mb-2">
//               No Orders Found
//             </h2>
//             <p className="text-gray-600 mb-6">
//               You haven't placed any orders yet.
//             </p>
//             <Link to="/products" className="btn-primary">
//               Start Shopping
//             </Link>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {orders.map((order) => (
//               <div
//                 key={order._id}
//                 className="bg-white rounded-lg shadow-md overflow-hidden"
//               >
//                 <div className="bg-gray-50 px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center">
//                   <div>
//                     <div className="flex items-center">
//                       <h2 className="text-lg font-medium text-gray-900">
//                         Order #{order._id.substring(0, 8)}
//                       </h2>
//                       <span
//                         className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
//                           order.status
//                         )}`}
//                       >
//                         {order.status}
//                       </span>
//                       <span
//                         className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
//                           order.isPaid
//                         )}`}
//                       >
//                         {order.isPaid ? "Paid" : "Payment Pending"}
//                       </span>
//                     </div>
//                     <p className="text-sm text-gray-500 mt-1">
//                       Placed on {new Date(order.createdAt).toLocaleDateString()}{" "}
//                       at {new Date(order.createdAt).toLocaleTimeString()}
//                     </p>
//                   </div>
//                   <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row items-end sm:items-center">
//                     <span className="font-medium text-primary">
//                       {formatPrice(order.totalPrice)}
//                     </span>
//                     <Link
//                       to={`/orders/${order._id}`}
//                       className="mt-2 sm:mt-0 sm:ml-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary-dark transition-colors"
//                     >
//                       View Details
//                     </Link>
//                   </div>
//                 </div>

//                 <div className="p-6">
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <div>
//                       <h3 className="text-sm font-medium text-gray-900 mb-2">
//                         Shipping Address
//                       </h3>
//                       <p className="text-sm text-gray-600">
//                         {order.shippingAddress?.name || "N/A"}
//                         <br />
//                         {order.shippingAddress?.address || "N/A"}
//                         <br />
//                         {order.shippingAddress?.city || "N/A"},{" "}
//                         {order.shippingAddress?.state || "N/A"}{" "}
//                         {order.shippingAddress?.postalCode || ""}
//                         <br />
//                         {order.shippingAddress?.country || "N/A"}
//                       </p>
//                     </div>

//                     <div>
//                       <h3 className="text-sm font-medium text-gray-900 mb-2">
//                         Payment Method
//                       </h3>
//                       <p className="text-sm text-gray-600">
//                         {order.paymentMethod || "N/A"}
//                         {order.isPaid ? (
//                           <span className="block text-green-600 text-xs mt-1">
//                             Paid on{" "}
//                             {order.paidAt
//                               ? new Date(order.paidAt).toLocaleDateString()
//                               : "N/A"}
//                           </span>
//                         ) : (
//                           <span className="block text-yellow-600 text-xs mt-1">
//                             {order.paymentMethod === "cod"
//                               ? "Pay on delivery"
//                               : "Payment pending"}
//                           </span>
//                         )}
//                       </p>
//                     </div>

//                     <div>
//                       <h3 className="text-sm font-medium text-gray-900 mb-2">
//                         Order Status
//                       </h3>
//                       <div className="space-y-2">
//                         <div className="flex items-center">
//                           <div
//                             className={`w-3 h-3 rounded-full ${
//                               ["processing", "shipped", "delivered"].includes(
//                                 order.status?.toLowerCase()
//                               )
//                                 ? "bg-green-500"
//                                 : "bg-gray-300"
//                             }`}
//                           ></div>
//                           <span className="ml-2 text-sm text-gray-600">
//                             Processing
//                           </span>
//                         </div>
//                         <div className="flex items-center">
//                           <div
//                             className={`w-3 h-3 rounded-full ${
//                               ["shipped", "delivered"].includes(
//                                 order.status?.toLowerCase()
//                               )
//                                 ? "bg-green-500"
//                                 : "bg-gray-300"
//                             }`}
//                           ></div>
//                           <span className="ml-2 text-sm text-gray-600">
//                             Shipped
//                           </span>
//                         </div>
//                         <div className="flex items-center">
//                           <div
//                             className={`w-3 h-3 rounded-full ${
//                               order.status?.toLowerCase() === "delivered"
//                                 ? "bg-green-500"
//                                 : "bg-gray-300"
//                             }`}
//                           ></div>
//                           <span className="ml-2 text-sm text-gray-600">
//                             Delivered
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mt-6">
//                     <h3 className="text-sm font-medium text-gray-900 mb-3">
//                       Order Items
//                     </h3>
//                     <div className="border rounded-lg overflow-hidden">
//                       <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                           <tr>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Product
//                             </th>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Quantity
//                             </th>
//                             <th
//                               scope="col"
//                               className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
//                             >
//                               Price
//                             </th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {order.orderItems?.map((item) => (
//                             <tr key={item._id || item.product}>
//                               <td className="px-6 py-4 whitespace-nowrap">
//                                 <div className="flex items-center">
//                                   <div className="h-10 w-10 flex-shrink-0">
//                                     <img
//                                       className="h-10 w-10 rounded-md object-cover"
//                                       src={item.image}
//                                       alt={item.name}
//                                       onError={(e) => {
//                                         e.target.onerror = null;
//                                         e.target.src =
//                                           "https://via.placeholder.com/300x300?text=Image+Not+Found";
//                                       }}
//                                     />
//                                   </div>
//                                   <div className="ml-4">
//                                     <div className="text-sm font-medium text-gray-900">
//                                       <Link to={`/products/${item.product}`}>
//                                         {item.name}
//                                       </Link>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap">
//                                 <div className="text-sm text-gray-900">
//                                   {item.quantity}
//                                 </div>
//                               </td>
//                               <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                                 {formatPrice(item.price * item.quantity)}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                         <tfoot className="bg-gray-50">
//                           <tr>
//                             <th
//                               scope="row"
//                               colSpan="2"
//                               className="px-6 py-3 text-right text-sm font-medium text-gray-900"
//                             >
//                               Subtotal
//                             </th>
//                             <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
//                               {formatPrice(
//                                 order.itemsPrice || order.totalPrice
//                               )}
//                             </td>
//                           </tr>
//                           <tr>
//                             <th
//                               scope="row"
//                               colSpan="2"
//                               className="px-6 py-3 text-right text-sm font-medium text-gray-900"
//                             >
//                               Shipping
//                             </th>
//                             <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
//                               {order.shippingPrice === 0
//                                 ? "Free"
//                                 : formatPrice(order.shippingPrice || 0)}
//                             </td>
//                           </tr>
//                           {order.taxPrice > 0 && (
//                             <>
//                               <tr>
//                                 <th
//                                   scope="row"
//                                   colSpan="2"
//                                   className="px-6 py-3 text-right text-sm font-medium text-gray-900"
//                                 >
//                                   Tax
//                                 </th>
//                                 <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
//                                   {formatPrice(order.taxPrice)}
//                                 </td>
//                               </tr>
//                               {order.taxPrice > 0 && (
//                                 <>
//                                   <tr>
//                                     <th
//                                       scope="row"
//                                       colSpan="2"
//                                       className="px-6 py-3 text-right text-sm font-medium text-gray-900"
//                                     >
//                                       CGST (9%)
//                                     </th>
//                                     <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
//                                       {formatPrice(order.taxPrice / 2)}
//                                     </td>
//                                   </tr>
//                                   <tr>
//                                     <th
//                                       scope="row"
//                                       colSpan="2"
//                                       className="px-6 py-3 text-right text-sm font-medium text-gray-900"
//                                     >
//                                       SGST (9%)
//                                     </th>
//                                     <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
//                                       {formatPrice(order.taxPrice / 2)}
//                                     </td>
//                                   </tr>
//                                 </>
//                               )}
//                             </>
//                           )}
//                           <tr className="border-t-2 border-gray-200">
//                             <th
//                               scope="row"
//                               colSpan="2"
//                               className="px-6 py-3 text-right text-sm font-bold text-gray-900"
//                             >
//                               Grand Total
//                             </th>
//                             <td className="px-6 py-3 text-right text-sm font-bold text-primary">
//                               {formatPrice(order.totalPrice)}
//                             </td>
//                           </tr>
//                         </tfoot>
//                       </table>
//                     </div>
//                   </div>

//                   {!order.isPaid &&
//                     (order.paymentMethod === "upi" ||
//                       order.paymentMethod === "rupay" ||
//                       order.paymentMethod === "bank_transfer") && (
//                       <div className="mt-6 border-t border-gray-200 pt-6">
//                         <h3 className="text-lg font-medium text-gray-900 mb-4">
//                           Payment Information
//                         </h3>
//                         <PaymentRequestForm
//                           orderId={order._id}
//                           amount={order.totalPrice}
//                           onSuccess={() => {
//                             // Refresh orders after successful payment request
//                             const fetchOrders = async () => {
//                               try {
//                                 const response = await ordersAPI.getMyOrders();
//                                 if (response?.data) {
//                                   if (Array.isArray(response.data)) {
//                                     setOrders(response.data);
//                                   } else if (
//                                     response.data.data &&
//                                     Array.isArray(response.data.data)
//                                   ) {
//                                     setOrders(response.data.data);
//                                   } else if (
//                                     response.data.orders &&
//                                     Array.isArray(response.data.orders)
//                                   ) {
//                                     setOrders(response.data.orders);
//                                   }
//                                 }
//                               } catch (err) {
//                                 console.error("Error fetching orders:", err);
//                               }
//                             };
//                             fetchOrders();
//                           }}
//                         />
//                         <div className="mt-4 text-center">
//                           <Link
//                             to="/payment-requests"
//                             className="text-primary hover:underline"
//                           >
//                             View all my payment requests
//                           </Link>
//                         </div>
//                       </div>
//                     )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MyOrders;
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ordersAPI } from "../utils/api";
import { formatPrice } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import PaymentRequestForm from "../components/PaymentRequestForm";
import Alert from "../components/Alert";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await ordersAPI.getMyOrders();

        if (!response || !response.data) {
          throw new Error("No data received from API");
        }

        // Handle different possible response structures
        let fetchedOrders = [];

        if (Array.isArray(response.data)) {
          fetchedOrders = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          fetchedOrders = response.data.data;
        } else if (
          response.data.orders &&
          Array.isArray(response.data.orders)
        ) {
          fetchedOrders = response.data.orders;
        } else {
          throw new Error("Unexpected API response format");
        }

        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(
          err.message || "Failed to load orders. Please try again later."
        );
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPaymentStatusColor = (isPaid) => {
    return isPaid
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary-dark"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="danger">
          <strong>Error!</strong> {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="theme-bg-secondary py-4 sm:py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">
              No Orders Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              You haven't placed any orders yet.
            </p>
            <Link
              to="/products"
              className="inline-block px-6 py-2 bg-primary dark:bg-primary-dark text-white rounded-md hover:bg-primary-dark dark:hover:bg-primary transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-gray-700 px-4 sm:px-6 py-3 sm:py-4 border-b dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                        Order #{order._id.substring(0, 8)}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                            order.isPaid
                          )}`}
                        >
                          {order.isPaid ? "Paid" : "Payment Pending"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}{" "}
                      at {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="w-full sm:w-auto flex justify-between items-center sm:items-end sm:flex-col">
                    <span className="text-sm sm:text-base font-medium text-primary dark:text-primary-dark">
                      {formatPrice(order.totalPrice)}
                    </span>
                    <Link
                      to={`/orders/${order._id}`}
                      className="ml-2 sm:ml-4 sm:mt-2 px-3 sm:px-4 py-1 sm:py-2 bg-primary dark:bg-primary-dark text-white text-xs sm:text-sm font-medium rounded hover:bg-primary-dark dark:hover:bg-primary transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Shipping Address
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {order.shippingAddress?.name || "N/A"}
                        <br />
                        {order.shippingAddress?.address || "N/A"}
                        <br />
                        {order.shippingAddress?.city || "N/A"},{" "}
                        {order.shippingAddress?.state || "N/A"}{" "}
                        {order.shippingAddress?.postalCode || ""}
                        <br />
                        {order.shippingAddress?.country || "N/A"}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Payment Method
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {order.paymentMethod || "N/A"}
                        {order.isPaid ? (
                          <span className="block text-green-600 dark:text-green-400 text-xs mt-1">
                            Paid on{" "}
                            {order.paidAt
                              ? new Date(order.paidAt).toLocaleDateString()
                              : "N/A"}
                          </span>
                        ) : (
                          <span className="block text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                            {order.paymentMethod === "cod"
                              ? "Pay on delivery"
                              : "Payment pending"}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Order Status
                      </h3>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                              ["processing", "shipped", "delivered"].includes(
                                order.status?.toLowerCase()
                              )
                                ? "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          ></div>
                          <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            Processing
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                              ["shipped", "delivered"].includes(
                                order.status?.toLowerCase()
                              )
                                ? "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          ></div>
                          <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            Shipped
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                              order.status?.toLowerCase() === "delivered"
                                ? "bg-green-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          ></div>
                          <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            Delivered
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
                      Order Items
                    </h3>
                    <div className="border rounded-lg overflow-hidden dark:border-gray-600">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th
                                scope="col"
                                className="px-3 sm:px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Product
                              </th>
                              <th
                                scope="col"
                                className="px-3 sm:px-6 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Qty
                              </th>
                              <th
                                scope="col"
                                className="px-3 sm:px-6 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                            {order.orderItems?.map((item) => (
                              <tr key={item._id || item.product}>
                                <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                      <img
                                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-md object-cover"
                                        src={item.image}
                                        alt={item.name}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src =
                                            "https://via.placeholder.com/300x300?text=Image+Not+Found";
                                        }}
                                      />
                                    </div>
                                    <div className="ml-2 sm:ml-4">
                                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                        <Link to={`/products/${item.product}`}>
                                          {item.name.length > 20
                                            ? `${item.name.substring(0, 20)}...`
                                            : item.name}
                                        </Link>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                  <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                                    {item.quantity}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                  {formatPrice(item.price * item.quantity)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th
                                scope="row"
                                colSpan="2"
                                className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white"
                              >
                                Subtotal
                              </th>
                              <td className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                {formatPrice(
                                  order.itemsPrice || order.totalPrice
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th
                                scope="row"
                                colSpan="2"
                                className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white"
                              >
                                Shipping
                              </th>
                              <td className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                {order.shippingPrice === 0
                                  ? "Free"
                                  : formatPrice(order.shippingPrice || 0)}
                              </td>
                            </tr>
                            {order.taxPrice > 0 && (
                              <>
                                <tr>
                                  <th
                                    scope="row"
                                    colSpan="2"
                                    className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white"
                                  >
                                    Tax
                                  </th>
                                  <td className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                    {formatPrice(order.taxPrice)}
                                  </td>
                                </tr>
                                {order.taxPrice > 0 && (
                                  <>
                                    <tr>
                                      <th
                                        scope="row"
                                        colSpan="2"
                                        className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white"
                                      >
                                        CGST (9%)
                                      </th>
                                      <td className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                        {formatPrice(order.taxPrice / 2)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <th
                                        scope="row"
                                        colSpan="2"
                                        className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white"
                                      >
                                        SGST (9%)
                                      </th>
                                      <td className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                        {formatPrice(order.taxPrice / 2)}
                                      </td>
                                    </tr>
                                  </>
                                )}
                              </>
                            )}
                            <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                              <th
                                scope="row"
                                colSpan="2"
                                className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-bold text-gray-900 dark:text-white"
                              >
                                Grand Total
                              </th>
                              <td className="px-3 sm:px-6 py-2 text-right text-xs sm:text-sm font-bold text-primary dark:text-primary-dark">
                                {formatPrice(order.totalPrice)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                  {!order.isPaid &&
                    (order.paymentMethod === "upi" ||
                      order.paymentMethod === "rupay" ||
                      order.paymentMethod === "bank_transfer") && (
                      <div className="mt-4 sm:mt-6 border-t border-gray-200 dark:border-gray-600 pt-4 sm:pt-6">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">
                          Payment Information
                        </h3>
                        <PaymentRequestForm
                          orderId={order._id}
                          amount={order.totalPrice}
                          onSuccess={() => {
                            // Refresh orders after successful payment request
                            const fetchOrders = async () => {
                              try {
                                const response = await ordersAPI.getMyOrders();
                                if (response?.data) {
                                  if (Array.isArray(response.data)) {
                                    setOrders(response.data);
                                  } else if (
                                    response.data.data &&
                                    Array.isArray(response.data.data)
                                  ) {
                                    setOrders(response.data.data);
                                  } else if (
                                    response.data.orders &&
                                    Array.isArray(response.data.orders)
                                  ) {
                                    setOrders(response.data.orders);
                                  }
                                }
                              } catch (err) {
                                console.error("Error fetching orders:", err);
                              }
                            };
                            fetchOrders();
                          }}
                        />
                        <div className="mt-3 sm:mt-4 text-center">
                          <Link
                            to="/payment-requests"
                            className="text-xs sm:text-sm text-primary dark:text-primary-dark hover:underline"
                          >
                            View all my payment requests
                          </Link>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
