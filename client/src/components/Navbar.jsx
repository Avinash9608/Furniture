import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleAuthDropdown = () => {
    setAuthDropdownOpen(!authDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const categories = [
    { name: "Sofas", path: "/products?category=sofas" },
    { name: "Beds", path: "/products?category=beds" },
    { name: "Tables", path: "/products?category=tables" },
    { name: "Chairs", path: "/products?category=chairs" },
    { name: "Wardrobes", path: "/products?category=wardrobes" },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-serif font-bold text-primary">
              Shyam Furnitures
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium ${
                isActive("/")
                  ? "text-primary"
                  : "text-gray-700 hover:text-primary"
              } transition-colors duration-300`}
            >
              Home
            </Link>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="font-medium text-gray-700 hover:text-primary flex items-center transition-colors duration-300"
              >
                Categories
                <svg
                  className={`ml-1 w-4 h-4 transition-transform duration-300 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                >
                  {categories.map((category, index) => (
                    <Link
                      key={index}
                      to={category.path}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>

            <Link
              to="/products"
              className={`font-medium ${
                isActive("/products")
                  ? "text-primary"
                  : "text-gray-700 hover:text-primary"
              } transition-colors duration-300`}
            >
              All Products
            </Link>

            <Link
              to="/about"
              className={`font-medium ${
                isActive("/about")
                  ? "text-primary"
                  : "text-gray-700 hover:text-primary"
              } transition-colors duration-300`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`font-medium ${
                isActive("/contact")
                  ? "text-primary"
                  : "text-gray-700 hover:text-primary"
              } transition-colors duration-300`}
            >
              Contact
            </Link>

            {/* Auth Dropdown */}
            <div className="relative">
              <button
                onClick={toggleAuthDropdown}
                className="font-medium text-gray-700 hover:text-primary flex items-center transition-colors duration-300"
              >
                {isAuthenticated ? (
                  <span>{user?.name || "Account"}</span>
                ) : (
                  <span>Login / Register</span>
                )}
                <svg
                  className={`ml-1 w-4 h-4 transition-transform duration-300 ${
                    authDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {authDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
                >
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                        onClick={() => setAuthDropdownOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                        onClick={() => setAuthDropdownOpen(false)}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setAuthDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                        onClick={() => setAuthDropdownOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
                        onClick={() => setAuthDropdownOpen(false)}
                      >
                        Register
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-primary transition-colors duration-300"
            >
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
              <span className="absolute top-0 right-0 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems || 0}
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-4 pb-4"
          >
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`font-medium ${
                  isActive("/") ? "text-primary" : "text-gray-700"
                } hover:text-primary transition-colors duration-300`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>

              <button
                onClick={toggleDropdown}
                className="font-medium text-gray-700 hover:text-primary flex items-center justify-between transition-colors duration-300"
              >
                Categories
                <svg
                  className={`ml-1 w-4 h-4 transition-transform duration-300 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="pl-4 space-y-2">
                  {categories.map((category, index) => (
                    <Link
                      key={index}
                      to={category.path}
                      className="block text-sm text-gray-700 hover:text-primary"
                      onClick={() => {
                        setDropdownOpen(false);
                        setIsOpen(false);
                      }}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}

              <Link
                to="/products"
                className={`font-medium ${
                  isActive("/products") ? "text-primary" : "text-gray-700"
                } hover:text-primary transition-colors duration-300`}
                onClick={() => setIsOpen(false)}
              >
                All Products
              </Link>

              <Link
                to="/about"
                className={`font-medium ${
                  isActive("/about") ? "text-primary" : "text-gray-700"
                } hover:text-primary transition-colors duration-300`}
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>

              <Link
                to="/contact"
                className={`font-medium ${
                  isActive("/contact") ? "text-primary" : "text-gray-700"
                } hover:text-primary transition-colors duration-300`}
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>

              {/* Mobile Auth Links */}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="font-medium text-gray-700 hover:text-primary transition-colors duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="font-medium text-gray-700 hover:text-primary transition-colors duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="font-medium text-gray-700 hover:text-primary transition-colors duration-300 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="font-medium text-gray-700 hover:text-primary transition-colors duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="font-medium text-gray-700 hover:text-primary transition-colors duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}

              <Link
                to="/cart"
                className="font-medium text-gray-700 hover:text-primary transition-colors duration-300 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <span>Cart</span>
                <svg
                  className="w-5 h-5 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
                <span className="ml-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems || 0}
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
