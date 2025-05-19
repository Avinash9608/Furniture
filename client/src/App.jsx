import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import MyPaymentRequests from "./pages/MyPaymentRequests";
import AdminLogin from "./pages/admin/AdminLoginNew";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import ReliableProducts from "./pages/admin/ReliableProducts";
import OfflineProducts from "./pages/admin/OfflineProducts";
import AdminAddProduct from "./pages/admin/AddProduct";
import AdminEditProduct from "./pages/admin/EditProduct";
import OfflineEditProduct from "./pages/admin/OfflineEditProduct";
import AdminCategories from "./pages/admin/CategoriesSimple";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminMessages from "./pages/admin/Messages";
import AdminPaymentSettings from "./pages/admin/PaymentSettings";
import AdminPaymentRequests from "./pages/admin/PaymentRequests";
import AdminShippingAddresses from "./pages/admin/ShippingAddresses";
import AdminSourceAddress from "./pages/admin/SourceAddress";
import TestProduct from "./pages/admin/TestProduct";
import SimpleAddProduct from "./pages/admin/SimpleAddProduct";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import UserProtectedRoute from "./components/UserProtectedRoute";
import ApiTest from "./components/ApiTest";
import ErrorBoundary from "./components/ErrorBoundary";

// Import custom Toast component
import { ToastManager } from "./components/Toast";

function App() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check if current route is admin route
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Custom Toast Manager for notifications */}
      <ToastManager position="top-right" />

      {/* Show Navbar only on non-admin routes */}
      {!isAdminRoute && <Navbar />}

      <main className={`flex-grow ${!isAdminRoute ? "" : "p-0"}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/api-test" element={<ApiTest />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route
            path="/products/:id"
            element={
              <ErrorBoundary showDetails={false}>
                <ProductDetail />
              </ErrorBoundary>
            }
          />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <UserProtectedRoute>
                <Checkout />
              </UserProtectedRoute>
            }
          />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected User Routes */}
          <Route
            path="/profile"
            element={
              <UserProtectedRoute>
                <Profile />
              </UserProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <UserProtectedRoute>
                <MyOrders />
              </UserProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <UserProtectedRoute>
                <OrderDetail />
              </UserProtectedRoute>
            }
          />
          <Route
            path="/payment-requests"
            element={
              <UserProtectedRoute>
                <MyPaymentRequests />
              </UserProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <OfflineProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products/add"
            element={
              <ProtectedRoute>
                <AdminAddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products/edit/:id"
            element={
              <ProtectedRoute>
                <OfflineEditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <AdminCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute>
                <AdminMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payment-settings"
            element={
              <ProtectedRoute>
                <AdminPaymentSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payment-requests"
            element={
              <ProtectedRoute>
                <AdminPaymentRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shipping-addresses"
            element={
              <ProtectedRoute>
                <AdminShippingAddresses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/source-address"
            element={
              <ProtectedRoute>
                <AdminSourceAddress />
              </ProtectedRoute>
            }
          />

          {/* Test Routes - No protection for testing */}
          <Route path="/admin/test-product" element={<TestProduct />} />
          <Route
            path="/admin/simple-add-product"
            element={<SimpleAddProduct />}
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Show Footer only on non-admin routes */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
