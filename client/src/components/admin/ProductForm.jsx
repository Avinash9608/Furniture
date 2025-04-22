// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import FileUpload from "../FileUpload";
// import Button from "../Button";
// import { validateProductForm } from "../../utils/validation";

// const ProductForm = ({
//   initialData = {},
//   categories = [],
//   onSubmit,
//   isSubmitting = false,
//   submitError = null,
// }) => {
//   // Initialize form state
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     price: "",
//     discountPrice: "",
//     category: "",
//     stock: "",
//     featured: false,
//     material: "",
//     color: "",
//     dimensions: {
//       length: "",
//       width: "",
//       height: "",
//     },
//     ...initialData,
//   });

//   // Form validation state
//   const [errors, setErrors] = useState({});
//   const [images, setImages] = useState([]);
//   const [touched, setTouched] = useState({});

//   // Set initial data when it changes
//   useEffect(() => {
//     if (initialData && Object.keys(initialData).length > 0) {
//       setFormData({
//         name: initialData.name || "",
//         description: initialData.description || "",
//         price: initialData.price || "",
//         discountPrice: initialData.discountPrice || "",
//         category: initialData.category?._id || initialData.category || "",
//         stock: initialData.stock || "",
//         featured: initialData.featured || false,
//         material: initialData.material || "",
//         color: initialData.color || "",
//         dimensions: {
//           length: initialData.dimensions?.length || "",
//           width: initialData.dimensions?.width || "",
//           height: initialData.dimensions?.height || "",
//         },
//       });

//       // Set images if available
//       if (initialData.images && initialData.images.length > 0) {
//         setImages(
//           initialData.images.map((img) =>
//             typeof img === "string" ? img : img.url
//           )
//         );
//       }
//     }
//   }, [initialData]);

//   // Handle form input changes
//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;

//     // Handle different input types
//     if (name.includes(".")) {
//       // Handle nested fields (e.g., dimensions.length)
//       const [parent, child] = name.split(".");
//       setFormData((prev) => ({
//         ...prev,
//         [parent]: {
//           ...prev[parent],
//           [child]:
//             type === "number" ? (value === "" ? "" : Number(value)) : value,
//         },
//       }));
//     } else {
//       // Handle regular fields
//       setFormData((prev) => ({
//         ...prev,
//         [name]:
//           type === "checkbox"
//             ? checked
//             : type === "number"
//             ? value === ""
//               ? ""
//               : Number(value)
//             : value,
//       }));
//     }

//     // Mark field as touched
//     setTouched((prev) => ({
//       ...prev,
//       [name]: true,
//     }));

//     // Clear error for this field
//     if (errors[name]) {
//       setErrors((prev) => ({
//         ...prev,
//         [name]: null,
//       }));
//     }
//   };

//   // Handle image upload
//   const handleImageChange = (newImages) => {
//     setImages(newImages);

//     // Clear error for images
//     if (errors.images) {
//       setErrors((prev) => ({
//         ...prev,
//         images: null,
//       }));
//     }
//   };

//   // Validate form on submit
//   const validateForm = () => {
//     // Create a product data object for validation
//     const productData = {
//       ...formData,
//       images: images,
//     };

//     // Validate the form
//     const { isValid, errors: validationErrors } =
//       validateProductForm(productData);

//     // Set errors
//     setErrors(validationErrors);

//     // Mark all fields as touched
//     const allTouched = Object.keys(formData).reduce((acc, key) => {
//       acc[key] = true;
//       return acc;
//     }, {});
//     setTouched(allTouched);

//     return isValid;
//   };

//   // Handle form submission
//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // Validate form
//     if (!validateForm()) {
//       return;
//     }

//     // Create form data for submission
//     const productData = {
//       ...formData,
//       images: images,
//     };

//     // Call onSubmit callback
//     onSubmit(productData);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       {/* Basic Information */}
//       <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">
//           Basic Information
//         </h3>

//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
//           {/* Product Name */}
//           <div className="col-span-2">
//             <label
//               htmlFor="name"
//               className="block text-sm font-medium text-gray-700 mb-1"
//             >
//               Product Name <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               id="name"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
//                 errors.name && touched.name
//                   ? "border-red-500"
//                   : "border-gray-300"
//               }`}
//               placeholder="Enter product name"
//             />
//             {errors.name && touched.name && (
//               <p className="mt-1 text-sm text-red-500">{errors.name}</p>
//             )}
//           </div>

//           {/* Category */}
//           <div>
//             <label
//               htmlFor="category"
//               className="block text-sm font-medium text-gray-700 mb-1"
//             >
//               Category <span className="text-red-500">*</span>
//             </label>
//             <div className="flex space-x-2">
//               <select
//                 id="category"
//                 name="category"
//                 value={formData.category}
//                 onChange={handleChange}
//                 className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
//                   errors.category && touched.category
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 }`}
//               >
//                 <option value="">Select a category</option>
//                 {categories && categories.length > 0 ? (
//                   categories.map((category) => (
//                     <option key={category._id} value={category._id}>
//                       {category.name}
//                     </option>
//                   ))
//                 ) : (
//                   <option value="" disabled>
//                     No categories available
//                   </option>
//                 )}
//               </select>

//               {/* Add Category Button - This will be handled by the parent component */}
//               {window.addCategory && (
//                 <button
//                   type="button"
//                   onClick={() => window.addCategory()}
//                   className="flex-shrink-0 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
//                 >
//                   <svg
//                     className="-ml-1 mr-1 h-5 w-5 text-gray-400"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                     ></path>
//                   </svg>
//                   New
//                 </button>
//               )}
//             </div>
//             {errors.category && touched.category && (
//               <p className="mt-1 text-sm text-red-500">{errors.category}</p>
//             )}
//           </div>

//           {/* Price */}
//           <div>
//             <label
//               htmlFor="price"
//               className="block text-sm font-medium text-gray-700 mb-1"
//             >
//               Price (₹) <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="number"
//               id="price"
//               name="price"
//               value={formData.price}
//               onChange={handleChange}
//               min="0"
//               step="1"
//               className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
//                 errors.price && touched.price
//                   ? "border-red-500"
//                   : "border-gray-300"
//               }`}
//               placeholder="Enter price"
//             />
//             {errors.price && touched.price && (
//               <p className="mt-1 text-sm text-red-500">{errors.price}</p>
//             )}
//           </div>

//           {/* Discount Price */}
//           <div>
//             <label
//               htmlFor="discountPrice"
//               className="block text-sm font-medium text-gray-700 mb-1"
//             >
//               Discount Price (₹)
//             </label>
//             <input
//               type="number"
//               id="discountPrice"
//               name="discountPrice"
//               value={formData.discountPrice}
//               onChange={handleChange}
//               min="0"
//               step="1"
//               className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
//                 errors.discountPrice && touched.discountPrice
//                   ? "border-red-500"
//                   : "border-gray-300"
//               }`}
//               placeholder="Enter discount price (optional)"
//             />
//             {errors.discountPrice && touched.discountPrice && (
//               <p className="mt-1 text-sm text-red-500">
//                 {errors.discountPrice}
//               </p>
//             )}
//           </div>

//           {/* Stock */}
//           <div>
//             <label
//               htmlFor="stock"
//               className="block text-sm font-medium text-gray-700 mb-1"
//             >
//               Stock <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="number"
//               id="stock"
//               name="stock"
//               value={formData.stock}
//               onChange={handleChange}
//               min="0"
//               step="1"
//               className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
//                 errors.stock && touched.stock
//                   ? "border-red-500"
//                   : "border-gray-300"
//               }`}
//               placeholder="Enter stock quantity"
//             />
//             {errors.stock && touched.stock && (
//               <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
//             )}
//           </div>

//           {/* Featured */}
//           <div className="flex items-center">
//             <input
//               type="checkbox"
//               id="featured"
//               name="featured"
//               checked={formData.featured}
//               onChange={handleChange}
//               className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
//             />
//             <label
//               htmlFor="featured"
//               className="ml-2 block text-sm text-gray-700"
//             >
//               Featured Product
//             </label>
//           </div>
//         </div>
//       </div>

//       {/* Description */}
//       <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>

//         <div>
//           <label
//             htmlFor="description"
//             className="block text-sm font-medium text-gray-700 mb-1"
//           >
//             Product Description <span className="text-red-500">*</span>
//           </label>
//           <textarea
//             id="description"
//             name="description"
//             value={formData.description}
//             onChange={handleChange}
//             rows="5"
//             className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
//               errors.description && touched.description
//                 ? "border-red-500"
//                 : "border-gray-300"
//             }`}
//             placeholder="Enter product description"
//           ></textarea>
//           {errors.description && touched.description && (
//             <p className="mt-1 text-sm text-red-500">{errors.description}</p>
//           )}
//         </div>
//       </div>

//       {/* Additional Details */}
//       <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">
//           Additional Details
//         </h3>

//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
//           {/* Material */}
//           <div>
//             <label
//               htmlFor="material"
//               className="block text-sm font-medium text-gray-700 mb-1"
//             >
//               Material
//             </label>
//             <input
//               type="text"
//               id="material"
//               name="material"
//               value={formData.material}
//               onChange={handleChange}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
//               placeholder="e.g., Wood, Metal, Plastic"
//             />
//           </div>

//           {/* Color */}
//           <div>
//             <label
//               htmlFor="color"
//               className="block text-sm font-medium text-gray-700 mb-1"
//             >
//               Color
//             </label>
//             <input
//               type="text"
//               id="color"
//               name="color"
//               value={formData.color}
//               onChange={handleChange}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
//               placeholder="e.g., Brown, Black, White"
//             />
//           </div>

//           {/* Dimensions */}
//           <div className="col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Dimensions (cm)
//             </label>
//             <div className="grid grid-cols-3 gap-4">
//               <div>
//                 <label
//                   htmlFor="dimensions.length"
//                   className="block text-xs text-gray-500 mb-1"
//                 >
//                   Length
//                 </label>
//                 <input
//                   type="number"
//                   id="dimensions.length"
//                   name="dimensions.length"
//                   value={formData.dimensions.length}
//                   onChange={handleChange}
//                   min="0"
//                   step="0.1"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
//                   placeholder="Length"
//                 />
//               </div>
//               <div>
//                 <label
//                   htmlFor="dimensions.width"
//                   className="block text-xs text-gray-500 mb-1"
//                 >
//                   Width
//                 </label>
//                 <input
//                   type="number"
//                   id="dimensions.width"
//                   name="dimensions.width"
//                   value={formData.dimensions.width}
//                   onChange={handleChange}
//                   min="0"
//                   step="0.1"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
//                   placeholder="Width"
//                 />
//               </div>
//               <div>
//                 <label
//                   htmlFor="dimensions.height"
//                   className="block text-xs text-gray-500 mb-1"
//                 >
//                   Height
//                 </label>
//                 <input
//                   type="number"
//                   id="dimensions.height"
//                   name="dimensions.height"
//                   value={formData.dimensions.height}
//                   onChange={handleChange}
//                   min="0"
//                   step="0.1"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
//                   placeholder="Height"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Images */}
//       <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">
//           Product Images
//         </h3>

//         <FileUpload
//           multiple
//           maxFiles={5}
//           maxSize={5}
//           accept="image/*"
//           value={images}
//           onChange={handleImageChange}
//           error={errors.images}
//           helperText="Upload up to 5 product images. First image will be used as the main product image."
//         />
//       </div>

//       {/* Submit Error */}
//       {submitError && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
//           {submitError}
//         </div>
//       )}

//       {/* Form Actions */}
//       <div className="flex justify-end space-x-3">
//         <Button
//           type="button"
//           variant="secondary"
//           onClick={() => window.history.back()}
//         >
//           Cancel
//         </Button>
//         <Button type="submit" disabled={isSubmitting}>
//           {isSubmitting
//             ? "Saving..."
//             : initialData._id
//             ? "Update Product"
//             : "Add Product"}
//         </Button>
//       </div>
//     </form>
//   );
// };

// export default ProductForm;

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
  // Initialize form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    discountPercentage: "",
    category: "",
    stock: "",
    featured: false,
    material: "",
    color: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
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
  const handleImageChange = (newImages) => {
    setImages(newImages);
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

    if (!validateForm()) return;

    const productData = {
      ...formData,
      images: images,
    };

    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Product Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                  errors.name && touched.name
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter product name"
              />
            </label>
            {errors.name && touched.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
              <div className="flex space-x-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                    errors.category && touched.category
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            {errors.category && touched.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹) <span className="text-red-500">*</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                  errors.price && touched.price
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter price"
              />
            </label>
            {errors.price && touched.price && (
              <p className="mt-1 text-sm text-red-500">{errors.price}</p>
            )}
          </div>

          {/* Discount Section */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {/* Discount Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Enter discount percentage"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Enter a percentage (e.g., 5 for 5% off)
              </p>
            </div>

            {/* Discount Price (calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                    errors.discountPrice && touched.discountPrice
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter discount price"
                />
              </label>
              {errors.discountPrice && touched.discountPrice && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.discountPrice}
                </p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock <span className="text-red-500">*</span>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                  errors.stock && touched.stock
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Enter stock quantity"
              />
            </label>
            {errors.stock && touched.stock && (
              <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
            )}
          </div>

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Featured Product
            </label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Description <span className="text-red-500">*</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                errors.description && touched.description
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter product description"
            />
          </label>
          {errors.description && touched.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Additional Details
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Wood, Metal, Plastic"
              />
            </label>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Brown, Black, White"
              />
            </label>
          </div>

          {/* Dimensions */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dimensions (cm)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Length
                  <input
                    type="number"
                    name="dimensions.length"
                    value={formData.dimensions.length}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Length"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Width
                  <input
                    type="number"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Width"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Height
                  <input
                    type="number"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Height"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {submitError}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
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
