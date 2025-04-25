import React from 'react';
import Alert from './Alert';

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
      errorInfo: null
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
        return typeof fallback === 'function' 
          ? fallback(error, this.resetErrorBoundary)
          : fallback;
      }
      
      // Default fallback UI
      return (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <Alert 
            type="error" 
            message={error?.message || "Something went wrong"} 
            className="mb-2"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
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
