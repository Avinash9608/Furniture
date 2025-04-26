import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import ProductDetailSimple from "./pages/ProductDetailSimple";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import MyOrders from "./pages/MyOrders";
import MyPaymentRequests from "./pages/MyPaymentRequests";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminAddProduct from "./pages/admin/AddProduct";
import AdminEditProduct from "./pages/admin/EditProduct";
import AdminCategories from "./pages/admin/CategoriesSimple";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminMessages from "./pages/admin/Messages";
import AdminPaymentSettings from "./pages/admin/PaymentSettings";
import AdminPaymentRequests from "./pages/admin/PaymentRequests";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import UserProtectedRoute from "./components/UserProtectedRoute";
import ApiTest from "./components/ApiTest";
import ErrorBoundary from "./components/ErrorBoundary";

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
                {window.location.hostname === "localhost" ? (
                  <ProductDetail />
                ) : (
                  <ProductDetailSimple />
                )}
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
                <AdminProducts />
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
                <AdminEditProduct />
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
