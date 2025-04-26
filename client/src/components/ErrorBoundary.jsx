import React from "react";
import Alert from "./Alert";

/**
 * Error Boundary component to catch and handle errors in child components
 * Prevents the entire application from crashing when a component throws an error
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    console.error("ErrorBoundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // Update state with error details
    this.setState({ errorInfo });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback, children, resetKey } = this.props;

    // If there's an error, render the fallback UI
    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return typeof fallback === "function"
          ? fallback(error, this.resetErrorBoundary)
          : fallback;
      }

      // Default fallback UI
      // Check if this is a product detail page
      const isProductPage = window.location.pathname.includes("/products/");

      if (isProductPage) {
        return (
          <div className="container-custom py-16">
            <Alert
              type="error"
              message="Something went wrong loading this product."
            />
            <div className="mt-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We're sorry, but there was an error loading this product. This
                could be due to:
              </p>
              <ul className="list-disc pl-5 mb-4 text-gray-700 dark:text-gray-300">
                <li>A temporary server issue</li>
                <li>The product may have been removed</li>
                <li>An issue with your internet connection</li>
              </ul>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/products"
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                >
                  Browse All Products
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="border border-primary text-primary px-4 py-2 rounded hover:bg-primary hover:text-white transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
            {this.props.showDetails && (
              <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                <h3 className="text-red-500 font-medium mb-2">
                  Error Details (for developers):
                </h3>
                <p className="font-mono text-sm mb-2">
                  {error && error.toString()}
                </p>
                <pre className="font-mono text-xs overflow-auto">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        );
      }

      // Default error UI for other pages
      return (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <Alert
            type="error"
            message={error?.message || "Something went wrong"}
            className="mb-2"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() =>
                this.setState({ hasError: false, error: null, errorInfo: null })
              }
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // If there's no error, render the children
    return children;
  }
}

export default ErrorBoundary;
