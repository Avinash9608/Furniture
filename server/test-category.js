const axios = require("axios");
const FormData = require("form-data");

// Create a test category
async function createTestCategory() {
  try {
    console.log("Creating test category...");

    // Create form data
    const formData = new FormData();
    // Add timestamp to make name unique
    const timestamp = new Date().getTime();
    formData.append("name", `Test Category ${timestamp}`);
    formData.append(
      "description",
      "This is a test category created from a script"
    );

    // Send request
    const response = await axios.post(
      "http://localhost:5000/api/categories",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Category created successfully:", response.data);
    return response.data.data._id;
  } catch (error) {
    console.error(
      "Error creating category:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

// Create a test product
async function createTestProduct(categoryId) {
  try {
    console.log("Creating test product...");

    // Create form data
    const formData = new FormData();
    // Add timestamp to make name unique
    const timestamp = new Date().getTime();
    formData.append("name", `Test Product ${timestamp}`);
    formData.append(
      "description",
      "This is a test product created from a script"
    );
    formData.append("price", "199.99");
    formData.append("stock", "10");
    formData.append("category", categoryId);
    formData.append("defaultImage", "true");

    // Add dimensions as JSON string
    const dimensions = {
      length: 100,
      width: 50,
      height: 75,
    };
    formData.append("dimensions", JSON.stringify(dimensions));

    // Send request
    const response = await axios.post(
      "http://localhost:5000/api/products",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log("Product created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating product:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

// Run the test
async function runTest() {
  try {
    // First create a category
    const categoryId = await createTestCategory();

    // Then create a product using that category
    await createTestProduct(categoryId);

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Run the test
runTest();
