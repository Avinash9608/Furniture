/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Indian)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone number is valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters' };
  }
  
  // Check for stronger password (optional)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
    return { 
      isValid: false, 
      message: 'Password should contain uppercase, lowercase letters and numbers' 
    };
  }
  
  if (!hasSpecialChar) {
    return { 
      isValid: false, 
      message: 'Password should contain at least one special character' 
    };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

/**
 * Validate required fields in a form
 * @param {object} formData - Form data to validate
 * @param {array} requiredFields - Array of required field names
 * @returns {object} Validation result with isValid and errors
 */
export const validateRequiredFields = (formData, requiredFields) => {
  const errors = {};
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!formData[field] || formData[field].trim() === '') {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

/**
 * Validate product form data
 * @param {object} productData - Product data to validate
 * @returns {object} Validation result with isValid and errors
 */
export const validateProductForm = (productData) => {
  const errors = {};
  
  // Required fields
  if (!productData.name || productData.name.trim() === '') {
    errors.name = 'Product name is required';
  }
  
  if (!productData.description || productData.description.trim() === '') {
    errors.description = 'Description is required';
  }
  
  if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
    errors.price = 'Price must be a positive number';
  }
  
  if (!productData.category) {
    errors.category = 'Category is required';
  }
  
  if (!productData.stock || isNaN(productData.stock) || productData.stock < 0) {
    errors.stock = 'Stock must be a non-negative number';
  }
  
  // Optional fields with validation
  if (productData.discountPrice && (isNaN(productData.discountPrice) || productData.discountPrice < 0)) {
    errors.discountPrice = 'Discount price must be a non-negative number';
  }
  
  if (productData.discountPrice && productData.discountPrice >= productData.price) {
    errors.discountPrice = 'Discount price must be less than regular price';
  }
  
  return { 
    isValid: Object.keys(errors).length === 0,
    errors 
  };
};

/**
 * Validate contact form data
 * @param {object} contactData - Contact form data to validate
 * @returns {object} Validation result with isValid and errors
 */
export const validateContactForm = (contactData) => {
  const errors = {};
  
  // Required fields
  if (!contactData.name || contactData.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  if (!contactData.email || contactData.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!isValidEmail(contactData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!contactData.subject || contactData.subject.trim() === '') {
    errors.subject = 'Subject is required';
  }
  
  if (!contactData.message || contactData.message.trim() === '') {
    errors.message = 'Message is required';
  }
  
  // Optional fields with validation
  if (contactData.phone && !isValidPhone(contactData.phone)) {
    errors.phone = 'Please enter a valid 10-digit phone number';
  }
  
  return { 
    isValid: Object.keys(errors).length === 0,
    errors 
  };
};
