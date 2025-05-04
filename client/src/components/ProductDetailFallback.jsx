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
    };

    const fetchProductData = async () => {
      try {
        setLoading(true);

        // Try to fetch from server first
        const baseUrl = window.location.origin;
        const deployedUrl = "https://furniture-q3nb.onrender.com";
        const localServerUrl = "http://localhost:5000";
        const isDevelopment = !baseUrl.includes("onrender.com");

        // Create a list of endpoints to try
        const endpointsToTry = [
          ...(isDevelopment
            ? [`${localServerUrl}/api/products/${id}`]
            : [`${baseUrl}/api/products/${id}`]),
          `${deployedUrl}/api/products/${id}`,
        ];

        // Try each endpoint
        let productData = null;
        let endpointSource = null;

        // First, try to get the product directly from localStorage
        try {
          const storedProduct = localStorage.getItem(`product-${id}`);
          if (storedProduct) {
            const parsedProduct = JSON.parse(storedProduct);
            if (parsedProduct && parsedProduct._id === id) {
              console.log("Found product in localStorage:", parsedProduct._id);
              productData = parsedProduct;
              endpointSource = "localStorage";
            }
          }
        } catch (localStorageError) {
          console.error("Error reading from localStorage:", localStorageError);
        }

        // If not found in localStorage, try the API endpoints
        if (!productData) {
          for (const endpoint of endpointsToTry) {
            try {
              console.log(`Trying endpoint: ${endpoint}`);
              const response = await axios.get(endpoint, {
                timeout: 15000,
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
              });

              if (response && response.data) {
                if (response.data.data) {
                  productData = response.data.data;
                  endpointSource = endpoint;

                  // Save to localStorage for future use
                  try {
                    localStorage.setItem(
                      `product-${id}`,
                      JSON.stringify(productData)
                    );
                  } catch (saveError) {
                    console.error("Error saving to localStorage:", saveError);
                  }

                  break;
                } else if (
                  typeof response.data === "object" &&
                  response.data._id
                ) {
                  productData = response.data;
                  endpointSource = endpoint;

                  // Save to localStorage for future use
                  try {
                    localStorage.setItem(
                      `product-${id}`,
                      JSON.stringify(productData)
                    );
                  } catch (saveError) {
                    console.error("Error saving to localStorage:", saveError);
                  }

                  break;
                }
              }
            } catch (error) {
              console.error(`Error with endpoint ${endpoint}:`, error.message);
            }
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
                // Use the existing category object
                processedCategory = productData.category;
                console.log(
                  "Using existing category object:",
                  processedCategory
                );
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

        // If server fetch failed, use hardcoded data for known products
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
