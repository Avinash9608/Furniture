/**
 * Validation utility functions for form validation
 */

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (basic validation)
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if phone is valid, false otherwise
 */
export const isValidPhone = (phone) => {
  // Basic validation for Indian phone numbers
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password is strong enough, false otherwise
 */
export const isStrongPassword = (password) => {
  // At least 6 characters, with at least one number
  return password.length >= 6 && /\d/.test(password);
};

/**
 * Validate login form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Validation result with isValid flag and errors object
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!formData.password) {
    errors.password = "Password is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate registration form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Validation result with isValid flag and errors object
 */
export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.name) {
    errors.name = "Name is required";
  }

  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!formData.password) {
    errors.password = "Password is required";
  } else if (!isStrongPassword(formData.password)) {
    errors.password =
      "Password must be at least 6 characters with at least one number";
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate contact form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Validation result with isValid flag and errors object
 */
export const validateContactForm = (formData) => {
  const errors = {};

  if (!formData.name) {
    errors.name = "Name is required";
  }

  if (!formData.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = "Please enter a valid phone number";
  }

  if (!formData.subject) {
    errors.subject = "Subject is required";
  }

  if (!formData.message) {
    errors.message = "Message is required";
  } else if (formData.message.length < 10) {
    errors.message = "Message must be at least 10 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate product form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Validation result with isValid flag and errors object
 */
export const validateProductForm = (formData) => {
  const errors = {};

  if (!formData.name) {
    errors.name = "Product name is required";
  }

  if (!formData.description) {
    errors.description = "Description is required";
  }

  if (!formData.price) {
    errors.price = "Price is required";
  } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
    errors.price = "Price must be a positive number";
  }

  if (
    formData.discountPrice &&
    (isNaN(formData.discountPrice) || Number(formData.discountPrice) <= 0)
  ) {
    errors.discountPrice = "Discount price must be a positive number";
  }

  if (
    formData.discountPrice &&
    Number(formData.discountPrice) >= Number(formData.price)
  ) {
    errors.discountPrice = "Discount price must be less than regular price";
  }

  if (!formData.category) {
    errors.category = "Category is required";
  }

  if (!formData.stock) {
    errors.stock = "Stock quantity is required";
  } else if (isNaN(formData.stock) || Number(formData.stock) < 0) {
    errors.stock = "Stock must be a non-negative number";
  }

  if (!formData.images || formData.images.length === 0) {
    errors.images = "At least one product image is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate category form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Validation result with isValid flag and errors object
 */
export const validateCategoryForm = (formData) => {
  const errors = {};

  if (!formData.name) {
    errors.name = "Category name is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate shipping address form
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Validation result with isValid flag and errors object
 */
export const validateShippingForm = (formData) => {
  const errors = {};

  if (!formData.name) {
    errors.name = "Full name is required";
  }

  if (!formData.address) {
    errors.address = "Address is required";
  }

  if (!formData.city) {
    errors.city = "City is required";
  }

  if (!formData.state) {
    errors.state = "State is required";
  }

  if (!formData.postalCode) {
    errors.postalCode = "Postal code is required";
  }

  if (!formData.phone) {
    errors.phone = "Phone number is required";
  } else if (!isValidPhone(formData.phone)) {
    errors.phone = "Please enter a valid phone number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
