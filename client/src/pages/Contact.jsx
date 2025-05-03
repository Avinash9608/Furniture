import React, { useState } from "react";
import { motion } from "framer-motion";
import contactAPI from "../utils/contactAPI";
import { validateContactForm } from "../utils/validation";
import Button from "../components/Button";
import Alert from "../components/Alert";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  // Handle form submission with improved error handling and timeout management
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateContactForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      console.log("Submitting contact form data:", formData);

      // Set a timeout to show a message if the submission takes too long
      const timeoutId = setTimeout(() => {
        // Don't set an error, just show a message that it's taking longer than expected
        console.log(
          "Contact form submission is taking longer than expected..."
        );
        // Show a warning to the user but keep the form in submitting state
        setSubmitError(
          "Your message is still being sent. This may take a moment due to network conditions. Please wait..."
        );
        // We don't set isSubmitting to false here to prevent multiple submissions
      }, 5000); // 5 seconds

      try {
        // Submit form data to API with increased timeout
        const response = await contactAPI.create(formData);
        console.log("Contact form API response:", response);

        // Clear the timeout since we got a response
        clearTimeout(timeoutId);

        // Check for errors in the response
        if (response.error) {
          setSubmitError(response.error);
          return;
        }

        // Check for warnings
        if (response.warning) {
          console.warn("Contact form submission warning:", response.warning);
        }

        // Reset form on success
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });

        setSubmitSuccess(true);

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } catch (apiError) {
        // Clear the timeout since we got an error
        clearTimeout(timeoutId);

        console.error("Error submitting contact form:", apiError);

        // If it's a timeout error, show a specific message
        if (apiError.message && apiError.message.includes("timeout")) {
          setSubmitError(
            "The server is taking too long to respond. Your message might still be processed. Please check back later or try again."
          );
        } else {
          setSubmitError(
            apiError.response?.data?.message ||
              `Failed to submit form: ${
                apiError.message || "Unknown error"
              }. Please try again later.`
          );
        }
      }
    } catch (error) {
      console.error("Unexpected error in contact form submission:", error);
      setSubmitError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="theme-bg-primary">
      {/* Hero Section */}
      <section className="relative h-[40vh] bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
            alt="Contact Us"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
        <div className="container-custom relative h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-gray-200">
              We'd love to hear from you. Get in touch with our team.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information and Form */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-serif font-bold mb-6">
                Get In Touch
              </h2>
              <p className="theme-text-primary mb-8">
                Have questions about our products or services? Need help with an
                order? Our team is here to assist you. Reach out to us through
                any of the following channels:
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-3 mr-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Our Location</h3>
                    <p className="theme-text-primary">
                      Main Road, Sharsha, Bihar, India - 845304
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-3 mr-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Phone Number</h3>
                    <p className="theme-text-primary">+91 9876543210</p>
                    <p className="theme-text-primary">+91 9876543211</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-3 mr-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Email Address</h3>
                    <p className="theme-text-primary">
                      info@shyamfurnitures.com
                    </p>
                    <p className="theme-text-primary">
                      support@shyamfurnitures.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-3 mr-4">
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Working Hours</h3>
                    <p className="theme-text-primary">
                      Monday - Saturday: 9:00 AM - 8:00 PM
                    </p>
                    <p className="theme-text-primary">
                      Sunday: 10:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Connect With Us</h3>
                <div className="flex space-x-4">
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                    </svg>
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-400 text-white p-3 rounded-full hover:bg-blue-500 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="theme-bg-primary rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-serif font-bold mb-6">
                  Send Us a Message
                </h2>

                {submitSuccess && (
                  <Alert
                    type="success"
                    message="Your message has been sent successfully! We'll get back to you soon."
                    onClose={() => setSubmitSuccess(false)}
                  />
                )}

                {submitError && (
                  <Alert
                    type="error"
                    message={submitError}
                    onClose={() => setSubmitError(null)}
                  />
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label
                      htmlFor="name"
                      className="block theme-text-primary font-medium mb-2"
                    >
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full border ${
                        errors.name ? "border-red-500" : "theme-border"
                      } rounded-md px-3 py-2 theme-bg-primary theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="block theme-text-primary font-medium mb-2"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full border ${
                        errors.email ? "border-red-500" : "theme-border"
                      } rounded-md px-3 py-2 theme-bg-primary theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="phone"
                      className="block theme-text-primary font-medium mb-2"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full border ${
                        errors.phone ? "border-red-500" : "theme-border"
                      } rounded-md px-3 py-2 theme-bg-primary theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                      placeholder="9876543210"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="subject"
                      className="block theme-text-primary font-medium mb-2"
                    >
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full border ${
                        errors.subject ? "border-red-500" : "theme-border"
                      } rounded-md px-3 py-2 theme-bg-primary theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                      placeholder="Product Inquiry"
                    />
                    {errors.subject && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="message"
                      className="block theme-text-primary font-medium mb-2"
                    >
                      Your Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full border ${
                        errors.message ? "border-red-500" : "theme-border"
                      } rounded-md px-3 py-2 theme-bg-primary theme-text-primary focus:outline-none focus:ring-1 focus:ring-primary`}
                      placeholder="How can we help you?"
                    ></textarea>
                    {errors.message && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 theme-bg-secondary">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">Our Location</h2>
            <p className="theme-text-secondary max-w-2xl mx-auto">
              Visit our showroom to experience our furniture collection in
              person
            </p>
          </div>

          <div className="rounded-lg overflow-hidden shadow-lg h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14452.767010423!2d85.24773!3d25.594095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed58dce6732867%3A0x4059f39a1ac82f06!2sSharsha%2C%20Bihar!5e0!3m2!1sen!2sin!4v1651234567890!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Shyam Furnitures Location"
            ></iframe>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="theme-text-secondary max-w-2xl mx-auto">
              Find answers to common questions about our products and services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="theme-bg-primary rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-3">
                What are your delivery options?
              </h3>
              <p className="theme-text-primary">
                We offer free delivery within Sharsha and surrounding areas for
                orders above ₹10,000. For other locations, delivery charges will
                apply based on distance. Delivery typically takes 3-5 business
                days.
              </p>
            </div>

            <div className="theme-bg-primary rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-3">
                Do you offer assembly services?
              </h3>
              <p className="theme-text-primary">
                Yes, we provide professional assembly services for all our
                furniture. Our trained technicians will ensure your furniture is
                properly assembled and installed at your location.
              </p>
            </div>

            <div className="theme-bg-primary rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-3">
                What is your return policy?
              </h3>
              <p className="theme-text-primary">
                We accept returns within 7 days of delivery for unused and
                undamaged products in their original packaging. Custom-made
                furniture cannot be returned unless there is a manufacturing
                defect.
              </p>
            </div>

            <div className="theme-bg-primary rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-3">
                Do you offer customization options?
              </h3>
              <p className="theme-text-primary">
                Yes, we offer customization services for most of our furniture
                pieces. You can choose from different materials, colors, and
                dimensions to match your specific requirements.
              </p>
            </div>

            <div className="theme-bg-primary rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-3">
                What payment methods do you accept?
              </h3>
              <p className="theme-text-primary">
                We accept cash, credit/debit cards, UPI payments, and bank
                transfers. For online purchases, we offer secure payment options
                through various payment gateways.
              </p>
            </div>

            <div className="theme-bg-primary rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-3">
                Do you provide warranty on your products?
              </h3>
              <p className="theme-text-primary">
                Yes, all our furniture comes with a 1-year warranty against
                manufacturing defects. Some premium products may have extended
                warranty periods. Please check the product details for specific
                warranty information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
