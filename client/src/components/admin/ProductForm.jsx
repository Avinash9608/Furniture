import React, { useState, useEffect } from "react";
import FileUpload from "../FileUpload";
import Button from "../Button";
import { validateProductForm } from "../../utils/validation";

const ProductForm = ({
  initialData = {},
  categories = [],
  onSubmit,
  isSubmitting = false,
  submitError = null,
}) => {
  // Ensure categories is always an array and has proper structure
  const validCategories = Array.isArray(categories)
    ? categories.map((category) => {
        // Ensure each category has a name and _id
        return {
          ...category,
          _id:
            category._id ||
            `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: category.name || category.displayName || "Unknown Category",
          displayName:
            category.displayName || category.name || "Unknown Category",
        };
      })
    : [];
  // Initialize form state
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    discountPrice: initialData?.discountPrice || "",
    discountPercentage: initialData?.discountPercentage || "",
    category: initialData?.category?._id || initialData?.category || "",
    stock: initialData?.stock || "",
    featured: initialData?.featured || false,
    material: initialData?.material || "",
    color: initialData?.color || "",
    dimensions: {
      length: initialData?.dimensions?.length || "",
      width: initialData?.dimensions?.width || "",
      height: initialData?.dimensions?.height || "",
    },
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);
  const [touched, setTouched] = useState({});

  // Set initial data when it changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // Calculate discount percentage if price and discountPrice are available
      let discountPercentage = "";
      if (
        initialData.price &&
        initialData.discountPrice &&
        initialData.price > initialData.discountPrice
      ) {
        discountPercentage = Math.round(
          ((initialData.price - initialData.discountPrice) /
            initialData.price) *
            100
        );
      }

      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        discountPrice: initialData.discountPrice || "",
        discountPercentage: discountPercentage,
        category: initialData.category?._id || initialData.category || "",
        stock: initialData.stock || "",
        featured: initialData.featured || false,
        material: initialData.material || "",
        color: initialData.color || "",
        dimensions: {
          length: initialData.dimensions?.length || "",
          width: initialData.dimensions?.width || "",
          height: initialData.dimensions?.height || "",
        },
      });

      // Set images if available
      if (initialData.images && initialData.images.length > 0) {
        setImages(
          initialData.images.map((img) =>
            typeof img === "string" ? img : img.url
          )
        );
      }
    }
  }, [initialData]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      // Handle nested fields (e.g., dimensions.length)
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]:
            type === "number" ? (value === "" ? "" : Number(value)) : value,
        },
      }));
    } else {
      // Handle regular fields
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
            ? value === ""
              ? ""
              : Number(value)
            : value,
      }));
    }

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Handle image upload
  const handleImageChange = async (newImages) => {
    // Get the hostname for environment detection
    const hostname = window.location.hostname;
    const isProduction =
      hostname.includes("render.com") ||
      hostname === "furniture-q3nb.onrender.com";

    console.log("Environment:", isProduction ? "Production" : "Development");

    // In production, use the dedicated image upload endpoint for new file uploads
    if (isProduction) {
      try {
        // Separate File objects and string URLs
        const fileImages = newImages.filter((image) => image instanceof File);
        const stringImages = newImages.filter(
          (image) => typeof image === "string"
        );

        console.log("New file images:", fileImages.length);
        console.log("Existing string images:", stringImages.length);

        // If there are new file images, upload them immediately
        if (fileImages.length > 0) {
          console.log(
            "Production environment detected, using dedicated image upload endpoint"
          );

          // Create a FormData object for the image upload
          const formData = new FormData();
          fileImages.forEach((file) => {
            formData.append("images", file);
          });

          // Add a cache-busting parameter
          formData.append("_t", Date.now());

          // Use fetch API directly to upload the images
          const uploadUrl = `${
            window.location.origin
          }/api/images/upload?_t=${Date.now()}`;
          console.log("Image upload URL:", uploadUrl);

          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache",
            },
          });

          if (uploadResponse.ok) {
            const data = await uploadResponse.json();
            console.log("Image upload successful:", data);

            // Replace the File objects with the uploaded image paths
            if (data.files && data.files.length > 0) {
              const uploadedPaths = data.files.map((file) => file.path);
              console.log("Uploaded image paths:", uploadedPaths);

              // Combine existing string images with new uploaded paths
              const updatedImages = [...stringImages, ...uploadedPaths];
              console.log("Final images array:", updatedImages);

              // Update the images state
              setImages(updatedImages);
            } else {
              // If no files were uploaded, just keep the string images
              setImages(stringImages);
            }
          } else {
            console.warn(
              "Image upload failed with status:",
              uploadResponse.status
            );
            const errorText = await uploadResponse.text();
            console.warn("Image upload error:", errorText);

            // Fall back to client-side handling
            setImages(newImages);
          }
        } else {
          // If there are no new file images, just update with the string images
          setImages(newImages);
        }
      } catch (uploadError) {
        console.error("Error uploading images:", uploadError);

        // Fall back to client-side handling
        setImages(newImages);
      }
    } else {
      // In development, use the standard approach
      setImages(newImages);
    }

    // Clear any image errors
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: null }));
    }
  };

  // Validate form on submit
  const validateForm = () => {
    const productData = {
      ...formData,
      images: images,
    };

    const { isValid, errors: validationErrors } =
      validateProductForm(productData);

    setErrors(validationErrors);
    setTouched(
      Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );

    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields first
    const requiredFields = ["name", "price", "stock"];
    const missingFields = requiredFields.filter((field) => {
      const value = formData[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...missingFields.reduce(
          (acc, field) => ({
            ...acc,
            [field]: `${
              field.charAt(0).toUpperCase() + field.slice(1)
            } is required`,
          }),
          {}
        ),
      }));
      setTouched((prev) => ({
        ...prev,
        ...missingFields.reduce(
          (acc, field) => ({ ...acc, [field]: true }),
          {}
        ),
      }));
      return;
    }

    if (!validateForm()) return;

    // Create FormData object
    const formDataToSubmit = new FormData();

    // Add basic fields with type conversion
    formDataToSubmit.append("name", formData.name.trim());
    formDataToSubmit.append("description", formData.description.trim());
    formDataToSubmit.append("price", Number(formData.price));
    formDataToSubmit.append("stock", Number(formData.stock));
    formDataToSubmit.append("category", formData.category);

    // Add category name if it's an offline category
    if (formData.category && formData.category.startsWith("offline_")) {
      const categoryObj = validCategories.find(
        (cat) => cat._id === formData.category
      );
      if (categoryObj) {
        formDataToSubmit.append(
          "categoryName",
          categoryObj.name || categoryObj.displayName
        );
      }
    }

    // Convert boolean to string for featured
    formDataToSubmit.append("featured", formData.featured.toString());

    // Add optional fields if they exist and are not empty
    if (formData.material && formData.material.trim()) {
      formDataToSubmit.append("material", formData.material.trim());
    }
    if (formData.color && formData.color.trim()) {
      formDataToSubmit.append("color", formData.color.trim());
    }
    if (formData.discountPrice) {
      formDataToSubmit.append("discountPrice", Number(formData.discountPrice));
    }

    // Add dimensions if they exist and are valid
    if (formData.dimensions) {
      const dimensions = {
        length: formData.dimensions.length
          ? Number(formData.dimensions.length)
          : 0,
        width: formData.dimensions.width
          ? Number(formData.dimensions.width)
          : 0,
        height: formData.dimensions.height
          ? Number(formData.dimensions.height)
          : 0,
      };
      formDataToSubmit.append("dimensions", JSON.stringify(dimensions));
    }

    // Add images if they exist
    if (images && images.length > 0) {
      // Get the hostname for environment detection
      const hostname = window.location.hostname;
      const isProduction =
        hostname.includes("render.com") ||
        hostname === "furniture-q3nb.onrender.com";

      console.log("Environment:", isProduction ? "Production" : "Development");

      // In production, handle images differently
      if (isProduction) {
        // For production, we've already uploaded the images in handleImageChange
        // So we only need to add the image paths to the form data

        // All images should be strings at this point (paths)
        const stringImages = images.filter(
          (image) => typeof image === "string"
        );
        const fileImages = images.filter((image) => image instanceof File);

        console.log("String images for submission:", stringImages.length);
        console.log("File images remaining (should be 0):", fileImages.length);

        // If there are still file images, log a warning
        if (fileImages.length > 0) {
          console.warn(
            "There are still file images that haven't been uploaded:",
            fileImages.length
          );
        }

        // Add existing image URLs as JSON array
        if (stringImages.length > 0) {
          formDataToSubmit.append(
            "existingImages",
            JSON.stringify(stringImages)
          );
          console.log("Added existingImages:", JSON.stringify(stringImages));
        }

        // Set replaceImages flag
        formDataToSubmit.append("replaceImages", "true");

        // Add a flag to indicate we're using the dedicated image endpoint
        formDataToSubmit.append("useImageEndpoint", "true");
      } else {
        // In development, use the standard approach
        // Separate File objects and string URLs
        const fileImages = images.filter((image) => image instanceof File);
        const stringImages = images.filter(
          (image) => typeof image === "string"
        );

        console.log("File images:", fileImages.length);
        console.log("String images:", stringImages.length);

        // Add new image files
        fileImages.forEach((image) => {
          formDataToSubmit.append("images", image);
        });

        // Add existing image URLs as JSON array
        if (stringImages.length > 0) {
          formDataToSubmit.append(
            "existingImages",
            JSON.stringify(stringImages)
          );
          console.log("Added existingImages:", JSON.stringify(stringImages));
        }

        // Set replaceImages flag
        formDataToSubmit.append("replaceImages", "true");
      }
    }

    // Log the form data for debugging
    console.log("Submitting form data:");
    for (let pair of formDataToSubmit.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    onSubmit(formDataToSubmit);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 dark:bg-gray-900 dark:text-gray-100"
    >
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
          {/* Product Name */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Name <span className="text-red-500">*</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base
                  ${
                    errors.name && touched.name
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="Enter product name"
              />
            </label>
            {errors.name && touched.name && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-red-500">*</span>
              <div className="flex space-x-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base
                    ${
                      errors.category && touched.category
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                >
                  <option value="">Select a category</option>
                  {/* Default Categories First */}
                  <option value="680c9481ab11e96a288ef6d9">Sofa Beds</option>
                  <option value="680c9484ab11e96a288ef6da">Tables</option>
                  <option value="680c9486ab11e96a288ef6db">Chairs</option>
                  <option value="680c9489ab11e96a288ef6dc">Wardrobes</option>
                  {/* Custom Categories */}
                  {validCategories &&
                    validCategories
                      .filter(
                        (category) =>
                          // Filter out default categories that we already added
                          ![
                            "680c9481ab11e96a288ef6d9",
                            "680c9484ab11e96a288ef6da",
                            "680c9486ab11e96a288ef6db",
                            "680c9489ab11e96a288ef6dc",
                          ].includes(category._id)
                      )
                      .map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.displayName || category.name}
                        </option>
                      ))}
                </select>
              </div>
            </label>
            {errors.category && touched.category && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 dark:text-red-400">
                {errors.category}
              </p>
            )}
          </div>

          {/* Price - Always full width on mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price (₹) <span className="text-red-500">*</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base
                  ${
                    errors.price && touched.price
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="Enter price"
              />
            </label>
            {errors.price && touched.price && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 dark:text-red-400">
                {errors.price}
              </p>
            )}
          </div>

          {/* Discount Section */}
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Discount Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Percentage (%)
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage || ""}
                  onChange={(e) => {
                    const percentage = e.target.value
                      ? Number(e.target.value)
                      : "";
                    const price = formData.price ? Number(formData.price) : 0;

                    // Calculate discounted price based on percentage
                    let discountPrice = "";
                    if (percentage && price) {
                      discountPrice = Math.round(
                        price - (price * percentage) / 100
                      );
                    }

                    setFormData((prev) => ({
                      ...prev,
                      discountPercentage: percentage,
                      discountPrice: discountPrice,
                    }));

                    // Mark fields as touched
                    setTouched((prev) => ({
                      ...prev,
                      discountPercentage: true,
                      discountPrice: true,
                    }));
                  }}
                  min="0"
                  max="99"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter discount percentage"
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter a percentage (e.g., 5 for 5% off)
              </p>
            </div>

            {/* Discount Price (calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Price (₹)
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={(e) => {
                    const discountPrice = e.target.value
                      ? Number(e.target.value)
                      : "";
                    const price = formData.price ? Number(formData.price) : 0;

                    // Calculate percentage based on discount price
                    let percentage = "";
                    if (discountPrice && price && discountPrice < price) {
                      percentage = Math.round(
                        ((price - discountPrice) / price) * 100
                      );
                    }

                    setFormData((prev) => ({
                      ...prev,
                      discountPrice: discountPrice,
                      discountPercentage: percentage,
                    }));

                    // Mark fields as touched
                    setTouched((prev) => ({
                      ...prev,
                      discountPrice: true,
                      discountPercentage: true,
                    }));
                  }}
                  min="0"
                  step="1"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base
                    ${
                      errors.discountPrice && touched.discountPrice
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="Enter discount price"
                />
              </label>
              {errors.discountPrice && touched.discountPrice && (
                <p className="mt-1 text-xs sm:text-sm text-red-500 dark:text-red-400">
                  {errors.discountPrice}
                </p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stock <span className="text-red-500">*</span>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base
                  ${
                    errors.stock && touched.stock
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="Enter stock quantity"
              />
            </label>
            {errors.stock && touched.stock && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 dark:text-red-400">
                {errors.stock}
              </p>
            )}
          </div>

          {/* Featured - Separate section on mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:opacity-0">
              &nbsp;
              <div className="flex items-center mt-2 sm:mt-6">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="h-4 w-4 sm:h-5 sm:w-5 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="ml-2 block text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  Featured Product
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          Description
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product Description <span className="text-red-500">*</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base
                ${
                  errors.description && touched.description
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }
                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              placeholder="Enter product description"
            />
          </label>
          {errors.description && touched.description && (
            <p className="mt-1 text-xs sm:text-sm text-red-500 dark:text-red-400">
              {errors.description}
            </p>
          )}
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          Additional Details
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Material
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Wood, Metal, Plastic"
              />
            </label>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Brown, Black, White"
              />
            </label>
          </div>

          {/* Dimensions */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dimensions (cm)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Length
                  <input
                    type="number"
                    name="dimensions.length"
                    value={formData.dimensions.length}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Length"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Width
                  <input
                    type="number"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Width"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Height
                  <input
                    type="number"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Height"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          Product Images
        </h3>
        <FileUpload
          multiple
          maxFiles={5}
          maxSize={5}
          accept="image/*"
          value={images}
          onChange={handleImageChange}
          error={errors.images}
          helperText="Upload up to 5 product images (5MB max each)"
        />
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm sm:text-base">
          {submitError}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? "Saving..."
            : initialData._id
            ? "Update Product"
            : "Add Product"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
