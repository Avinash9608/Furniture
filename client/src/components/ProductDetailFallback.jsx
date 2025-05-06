import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ProductDetailFallback = ({ children, onProductLoaded, onError }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const productLoadedRef = useRef(false);

  useEffect(() => {
    // Reset the productLoadedRef when the id changes
    productLoadedRef.current = false;

    if (!id) {
      setLoading(false);
      return;
    }

    // Define category mappings for fallback
    const categoryMap = {
      "680c9481ab11e96a288ef6d9": {
        _id: "680c9481ab11e96a288ef6d9",
        name: "Sofa Beds",
        slug: "sofa-beds",
      },
      "680c9484ab11e96a288ef6da": {
        _id: "680c9484ab11e96a288ef6da",
        name: "Tables",
        slug: "tables",
      },
      "680c9486ab11e96a288ef6db": {
        _id: "680c9486ab11e96a288ef6db",
        name: "Chairs",
        slug: "chairs",
      },
      "680c9489ab11e96a288ef6dc": {
        _id: "680c9489ab11e96a288ef6dc",
        name: "Wardrobes",
        slug: "wardrobes",
      },
      "680c948eab11e96a288ef6dd": {
        _id: "680c948eab11e96a288ef6dd",
        name: "Beds",
        slug: "beds",
      },
    };

    const fetchProductData = async () => {
      try {
        setLoading(true);

        // Try to fetch from server first
        const baseUrl = window.location.origin;
        const deployedUrl = "https://furniture-q3nb.onrender.com";
        const localServerUrl = "http://localhost:5000";
        const isDevelopment = !baseUrl.includes("onrender.com");

        // Create a list of endpoints to try - always include both local and deployed endpoints
        // This ensures we try all possible sources regardless of environment
        const endpointsToTry = [
          // Try direct endpoints first (these always work)
          ...(isDevelopment
            ? [`${localServerUrl}/api/direct-product/${id}`]
            : [`${baseUrl}/api/direct-product/${id}`]),
          `${deployedUrl}/api/direct-product/${id}`,

          // Try reliable endpoints next
          ...(isDevelopment
            ? [`${localServerUrl}/api/reliable/products/${id}`]
            : [`${baseUrl}/api/reliable/products/${id}`]),
          `${deployedUrl}/api/reliable/products/${id}`,

          // Then try standard API endpoints
          ...(isDevelopment
            ? [`${localServerUrl}/api/products/${id}`]
            : [`${baseUrl}/api/products/${id}`]),
          `${deployedUrl}/api/products/${id}`,

          // Try debug endpoints
          ...(isDevelopment
            ? [`${localServerUrl}/api/debug/product/${id}`]
            : [`${baseUrl}/api/debug/product/${id}`]),
          `${deployedUrl}/api/debug/product/${id}`,
        ];

        // Try each endpoint
        let productData = null;
        let endpointSource = null;

        // Skip localStorage for initial load to ensure fresh data
        // This ensures we always get the latest data from the server
        const skipLocalStorage = true;

        // If not found in localStorage, try the API endpoints
        if (!productData) {
          for (const endpoint of endpointsToTry) {
            try {
              console.log(`Trying endpoint: ${endpoint}`);
              console.log(`Attempting to fetch product from: ${endpoint}`);

              // Create a direct axios instance with retry capability
              const directApi = axios.create({
                timeout: 30000, // Increased timeout to 30 seconds
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                // Add retry configuration
                retry: 2,
                retryDelay: 1000,
              });

              // Add retry interceptor
              directApi.interceptors.response.use(undefined, async (err) => {
                const { config } = err;
                if (!config || !config.retry) {
                  return Promise.reject(err);
                }
                config.__retryCount = config.__retryCount || 0;
                if (config.__retryCount >= config.retry) {
                  return Promise.reject(err);
                }
                config.__retryCount += 1;
                console.log(
                  `Retrying request to ${endpoint} (${config.__retryCount}/${config.retry})...`
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, config.retryDelay)
                );
                return directApi(config);
              });

              const response = await directApi.get(endpoint);

              if (response && response.data) {
                console.log(`Response from ${endpoint}:`, response.data);

                // Handle different response formats
                let extractedData = null;

                // Format 1: { data: { ... } }
                if (response.data.data) {
                  extractedData = response.data.data;
                  console.log("Extracted product data from response.data.data");
                }
                // Format 2: { _id: ... }
                else if (
                  typeof response.data === "object" &&
                  response.data._id
                ) {
                  extractedData = response.data;
                  console.log(
                    "Extracted product data directly from response.data"
                  );
                }
                // Format 3: { success: true, data: { ... } }
                else if (response.data.success && response.data.data) {
                  extractedData = response.data.data;
                  console.log("Extracted product data from success response");
                }

                // Verify the extracted data has the required product ID
                if (extractedData && extractedData._id) {
                  console.log(
                    `Successfully extracted product with ID: ${extractedData._id}`
                  );

                  // Verify this is the product we're looking for
                  const extractedId = extractedData._id.toString();
                  const requestedId = id.toString();

                  if (
                    extractedId === requestedId ||
                    extractedId.includes(requestedId) ||
                    requestedId.includes(extractedId)
                  ) {
                    console.log("Product ID matches requested ID");
                    productData = extractedData;
                    endpointSource = endpoint;

                    // Save to localStorage for future use
                    try {
                      localStorage.setItem(
                        `product-${id}`,
                        JSON.stringify(productData)
                      );
                      console.log(
                        `Product saved to localStorage with key: product-${id}`
                      );
                    } catch (saveError) {
                      console.error("Error saving to localStorage:", saveError);
                    }

                    break;
                  } else {
                    console.warn(
                      `Product ID mismatch: expected ${requestedId}, got ${extractedId}`
                    );
                  }
                } else {
                  console.warn(
                    "Could not extract valid product data from response"
                  );
                }
              }
            } catch (error) {
              console.error(`Error with endpoint ${endpoint}:`, error.message);
            }
          }
        }

        // If we still don't have product data, try one last direct approach
        if (!productData) {
          try {
            console.log("Attempting direct fetch as last resort");
            const directUrl = `${deployedUrl}/api/direct-product/${id}`;

            console.log(`Trying direct product endpoint: ${directUrl}`);
            const directResponse = await axios.get(directUrl, {
              timeout: 60000, // Extended timeout for direct fetch
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            });

            if (directResponse && directResponse.data) {
              console.log("Direct fetch response:", directResponse.data);

              if (directResponse.data.data) {
                productData = directResponse.data.data;
                endpointSource = "direct-fetch";
                console.log("Successfully retrieved product via direct fetch");

                // Save to localStorage
                try {
                  localStorage.setItem(
                    `product-${id}`,
                    JSON.stringify(productData)
                  );
                } catch (saveError) {
                  console.error(
                    "Error saving direct fetch result to localStorage:",
                    saveError
                  );
                }
              }
            }
          } catch (directError) {
            console.error("Direct fetch attempt failed:", directError.message);
          }
        }

        // If we found product data from the server, use it
        if (productData) {
          // Process category if it exists
          let processedCategory = null;

          // Log the category for debugging
          console.log("Product category:", productData.category);

          if (productData.category) {
            if (typeof productData.category === "string") {
              // If category is a string ID, map it to a name
              const categoryId = productData.category;

              // Check if it's one of our known category IDs
              if (categoryMap[categoryId]) {
                processedCategory = categoryMap[categoryId];
                console.log("Mapped category from ID:", processedCategory);
              } else {
                // Try to determine category from product name or other attributes
                let categoryName = "Furniture";

                // Check product name for category hints
                const productName = productData.name
                  ? productData.name.toLowerCase()
                  : "";
                if (
                  productName.includes("sofa") ||
                  productName.includes("couch") ||
                  productName.includes("bed")
                ) {
                  categoryName = "Sofa Beds";
                } else if (
                  productName.includes("table") ||
                  productName.includes("desk")
                ) {
                  categoryName = "Tables";
                } else if (
                  productName.includes("chair") ||
                  productName.includes("stool")
                ) {
                  categoryName = "Chairs";
                } else if (
                  productName.includes("wardrobe") ||
                  productName.includes("cabinet") ||
                  productName.includes("storage")
                ) {
                  categoryName = "Wardrobes";
                }

                processedCategory = {
                  _id: categoryId,
                  name: categoryName,
                  slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
                };
                console.log(
                  "Inferred category from product name:",
                  processedCategory
                );
              }
            } else if (typeof productData.category === "object") {
              // It's already a category object
              if (productData.category.name) {
                // Check if the name is a default category name (like "Category 680c948e")
                if (productData.category.name.startsWith("Category ")) {
                  // Extract the ID from the name
                  const idPart = productData.category.name.split(" ")[1];

                  // Check if we have a mapping for this ID
                  if (categoryMap[productData.category._id]) {
                    // Use our mapped category name
                    processedCategory = {
                      ...productData.category,
                      name: categoryMap[productData.category._id].name,
                      slug: categoryMap[productData.category._id].slug,
                    };
                    console.log(
                      "Fixed default category name:",
                      processedCategory
                    );
                  } else {
                    // Try to create a better name based on product
                    let betterName = "Furniture";

                    // Check product name for category hints
                    const productName = productData.name
                      ? productData.name.toLowerCase()
                      : "";
                    if (
                      productName.includes("sofa") ||
                      productName.includes("couch")
                    ) {
                      betterName = "Sofa Beds";
                    } else if (productName.includes("bed")) {
                      betterName = "Beds";
                    } else if (
                      productName.includes("table") ||
                      productName.includes("desk")
                    ) {
                      betterName = "Tables";
                    } else if (
                      productName.includes("chair") ||
                      productName.includes("stool")
                    ) {
                      betterName = "Chairs";
                    } else if (
                      productName.includes("wardrobe") ||
                      productName.includes("cabinet")
                    ) {
                      betterName = "Wardrobes";
                    }

                    processedCategory = {
                      ...productData.category,
                      name: betterName,
                      slug: betterName.toLowerCase().replace(/\s+/g, "-"),
                    };
                    console.log(
                      "Created better category name:",
                      processedCategory
                    );
                  }
                } else {
                  // Use the existing category object as is
                  processedCategory = productData.category;
                  console.log(
                    "Using existing category object:",
                    processedCategory
                  );
                }
              } else if (productData.category._id) {
                // It has an ID but no name, try to map it
                const categoryId = productData.category._id;
                if (categoryMap[categoryId]) {
                  processedCategory = {
                    ...productData.category,
                    ...categoryMap[categoryId],
                  };
                  console.log(
                    "Enhanced category object with name:",
                    processedCategory
                  );
                }
              }
            }
          }

          // If no valid category was found, use a default based on product name
          if (!processedCategory) {
            // Try to determine category from product name
            let categoryName = "Furniture";

            // Check product name for category hints
            const productName = productData.name
              ? productData.name.toLowerCase()
              : "";
            if (
              productName.includes("sofa") ||
              productName.includes("couch") ||
              productName.includes("bed")
            ) {
              categoryName = "Sofa Beds";
            } else if (
              productName.includes("table") ||
              productName.includes("desk")
            ) {
              categoryName = "Tables";
            } else if (
              productName.includes("chair") ||
              productName.includes("stool")
            ) {
              categoryName = "Chairs";
            } else if (
              productName.includes("wardrobe") ||
              productName.includes("cabinet") ||
              productName.includes("storage")
            ) {
              categoryName = "Wardrobes";
            }

            processedCategory = {
              _id: "inferred-category",
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
            };
            console.log("Using inferred category:", processedCategory);
          }

          // Create a safe product object
          const safeProduct = {
            ...productData,
            _id: productData._id || id,
            name: productData.name || "Unknown Product",
            description: productData.description || "No description available",
            price: productData.price || 0,
            discountPrice: productData.discountPrice || null,
            stock: productData.stock || 0,
            ratings: productData.ratings || 0,
            numReviews: productData.numReviews || 0,
            images: Array.isArray(productData.images) ? productData.images : [],
            category: processedCategory,
            reviews: Array.isArray(productData.reviews)
              ? productData.reviews
              : [],
            specifications: Array.isArray(productData.specifications)
              ? productData.specifications
              : [],
          };

          // Save to localStorage for future use
          try {
            localStorage.setItem(`product-${id}`, JSON.stringify(safeProduct));
            console.log("Product saved to localStorage for future use");
          } catch (saveError) {
            console.error("Error saving to localStorage:", saveError);
          }

          setProduct(safeProduct);
          setSource(endpointSource);
          setLoading(false);

          // Only call onProductLoaded once per product
          if (onProductLoaded && !productLoadedRef.current) {
            productLoadedRef.current = true;
            onProductLoaded(safeProduct, endpointSource);
          }
          return;
        }

        // Check localStorage for cached product data before using hardcoded data
        try {
          const cachedProduct = localStorage.getItem(`product-${id}`);
          if (cachedProduct) {
            try {
              const parsedProduct = JSON.parse(cachedProduct);
              console.log(
                "Using cached product data from localStorage:",
                parsedProduct._id
              );

              setProduct(parsedProduct);
              setSource("localStorage");
              setLoading(false);

              // Only call onProductLoaded once per product
              if (onProductLoaded && !productLoadedRef.current) {
                productLoadedRef.current = true;
                onProductLoaded(parsedProduct, "localStorage");
              }
              return;
            } catch (parseError) {
              console.error("Error parsing cached product data:", parseError);
              // Continue to hardcoded data if parsing fails
            }
          }
        } catch (localStorageError) {
          console.error("Error accessing localStorage:", localStorageError);
          // Continue to hardcoded data if localStorage access fails
        }

        // If localStorage doesn't have the data, use hardcoded data for known products
        if (id === "680dcd6207d80949f2c7f36e") {
          const hardcodedProduct = {
            _id: "680dcd6207d80949f2c7f36e",
            name: "Elegant Wooden Sofa",
            description:
              "A beautiful wooden sofa with comfortable cushions. Perfect for your living room.",
            price: 24999,
            discountPrice: 19999,
            category: categoryMap["680c9481ab11e96a288ef6d9"],
            stock: 15,
            ratings: 4.7,
            numReviews: 24,
            images: [
              "https://placehold.co/800x600/brown/white?text=Elegant+Wooden+Sofa",
              "https://placehold.co/800x600/brown/white?text=Sofa+Side+View",
              "https://placehold.co/800x600/brown/white?text=Sofa+Front+View",
            ],
            specifications: [
              { name: "Material", value: "Sheesham Wood" },
              { name: "Dimensions", value: "72 x 30 x 32 inches" },
              { name: "Weight", value: "45 kg" },
              { name: "Seating Capacity", value: "3 People" },
              { name: "Cushion Material", value: "High-density Foam" },
              { name: "Category", value: "Sofa Beds" },
            ],
            reviews: [],
          };

          // Save to localStorage for future use
          try {
            localStorage.setItem(
              `product-${id}`,
              JSON.stringify(hardcodedProduct)
            );
          } catch (saveError) {
            console.error(
              "Error saving hardcoded product to localStorage:",
              saveError
            );
          }

          setProduct(hardcodedProduct);
          setSource("hardcoded_data");
          setLoading(false);

          // Only call onProductLoaded once per product
          if (onProductLoaded && !productLoadedRef.current) {
            productLoadedRef.current = true;
            onProductLoaded(hardcodedProduct, "hardcoded_data");
          }
          return;
        }

        if (id === "680cfe0ee4e0274a4cc9a1ea") {
          const hardcodedProduct = {
            _id: "680cfe0ee4e0274a4cc9a1ea",
            name: "Modern Dining Table",
            description:
              "A stylish dining table perfect for family gatherings and dinner parties.",
            price: 18999,
            discountPrice: 15999,
            category: categoryMap["680c9484ab11e96a288ef6da"],
            stock: 10,
            ratings: 4.5,
            numReviews: 18,
            images: [
              "https://placehold.co/800x600/darkwood/white?text=Modern+Dining+Table",
              "https://placehold.co/800x600/darkwood/white?text=Table+Top+View",
              "https://placehold.co/800x600/darkwood/white?text=Table+Side+View",
            ],
            specifications: [
              { name: "Material", value: "Teak Wood" },
              { name: "Dimensions", value: "72 x 36 x 30 inches" },
              { name: "Weight", value: "40 kg" },
              { name: "Seating Capacity", value: "6 People" },
              { name: "Finish", value: "Polished" },
              { name: "Category", value: "Tables" },
            ],
            reviews: [],
          };

          // Save to localStorage for future use
          try {
            localStorage.setItem(
              `product-${id}`,
              JSON.stringify(hardcodedProduct)
            );
          } catch (saveError) {
            console.error(
              "Error saving hardcoded product to localStorage:",
              saveError
            );
          }

          setProduct(hardcodedProduct);
          setSource("hardcoded_data");
          setLoading(false);

          // Only call onProductLoaded once per product
          if (onProductLoaded && !productLoadedRef.current) {
            productLoadedRef.current = true;
            onProductLoaded(hardcodedProduct, "hardcoded_data");
          }
          return;
        }

        // For other products, use a fallback
        // Try to determine a reasonable category based on the ID
        let categoryInfo = {
          _id: "fallback-category",
          name: "Furniture",
          slug: "furniture",
        };

        // Check if the ID matches any known category pattern
        if (id.includes("table") || id.includes("desk")) {
          categoryInfo = categoryMap["680c9484ab11e96a288ef6da"]; // Tables
        } else if (id.includes("chair") || id.includes("stool")) {
          categoryInfo = categoryMap["680c9486ab11e96a288ef6db"]; // Chairs
        } else if (
          id.includes("sofa") ||
          id.includes("couch") ||
          id.includes("bed")
        ) {
          categoryInfo = categoryMap["680c9481ab11e96a288ef6d9"]; // Sofa Beds
        } else if (
          id.includes("wardrobe") ||
          id.includes("cabinet") ||
          id.includes("storage")
        ) {
          categoryInfo = categoryMap["680c9489ab11e96a288ef6dc"]; // Wardrobes
        }

        const fallbackProduct = {
          _id: id,
          name: "Product " + id.substring(0, 8),
          description:
            "This is a fallback product shown when all data fetching attempts failed.",
          price: 19999,
          discountPrice: 15999,
          category: categoryInfo,
          stock: 10,
          ratings: 4.5,
          numReviews: 12,
          images: [
            "https://placehold.co/800x600/orange/white?text=Product+" +
              id.substring(0, 8),
          ],
          specifications: [
            { name: "Material", value: "Wood" },
            { name: "Dimensions", value: "80 x 60 x 40 cm" },
            { name: "Weight", value: "15 kg" },
            { name: "Category", value: categoryInfo.name },
          ],
          reviews: [],
        };

        // Save fallback product to localStorage for future use
        try {
          localStorage.setItem(
            `product-${id}`,
            JSON.stringify(fallbackProduct)
          );
          console.log("Fallback product saved to localStorage for future use");
        } catch (saveError) {
          console.error(
            "Error saving fallback product to localStorage:",
            saveError
          );
        }

        setProduct(fallbackProduct);
        setSource("fallback");
        setLoading(false);

        // Only call onProductLoaded once per product
        if (onProductLoaded && !productLoadedRef.current) {
          productLoadedRef.current = true;
          onProductLoaded(fallbackProduct, "fallback");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product details");
        setLoading(false);
        if (onError) onError(error.message);
      }
    };

    fetchProductData();
  }, [id, onProductLoaded, onError]);

  return children({ product, loading, error, source });
};

export default ProductDetailFallback;
