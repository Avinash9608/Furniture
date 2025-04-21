import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  className = '', 
  to, 
  onClick,
  disabled = false,
  fullWidth = false,
  ...rest 
}) => {
  // Define button styles based on variant
  const getButtonStyles = () => {
    const baseStyles = 'font-medium py-2 px-4 rounded transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
    const widthStyles = fullWidth ? 'w-full' : '';
    
    const variantStyles = {
      primary: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
      outline: 'bg-transparent border border-amber-600 text-amber-600 hover:bg-amber-50 focus:ring-amber-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      link: 'bg-transparent text-amber-600 hover:text-amber-700 hover:underline p-0 focus:ring-0'
    };
    
    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    
    return `${baseStyles} ${variantStyles[variant]} ${widthStyles} ${disabledStyles} ${className}`;
  };
  
  // If 'to' prop is provided, render a Link component
  if (to) {
    return (
      <Link to={to} className={getButtonStyles()} {...rest}>
        {children}
      </Link>
    );
  }
  
  // Otherwise, render a button element
  return (
    <button
      type={type}
      className={getButtonStyles()}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
