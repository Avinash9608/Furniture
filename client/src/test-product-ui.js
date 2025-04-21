// This is a test script to help debug product creation
// Run this in the browser console on the Add Product page

async function testProductCreation() {
  try {
    // Create a test product with a unique name
    const timestamp = new Date().getTime();
    const productData = {
      name: `UI Test Product ${timestamp}`,
      description: 'This is a test product created from the UI',
      price: 299.99,
      stock: 5,
      category: document.querySelector('select[name="category"]').value, // Get the first category from the dropdown
      dimensions: {
        length: 120,
        width: 60,
        height: 80
      },
      material: 'Wood',
      color: 'Brown',
      featured: true
    };
    
    console.log('Creating product with data:', productData);
    
    // Create FormData
    const formData = new FormData();
    
    // Add all fields to FormData
    Object.keys(productData).forEach(key => {
      if (key === 'dimensions') {
        formData.append('dimensions', JSON.stringify(productData.dimensions));
      } else {
        formData.append(key, productData[key]);
      }
    });
    
    // Add defaultImage flag since we're not uploading any images
    formData.append('defaultImage', 'true');
    
    // Log FormData entries
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
    }
    
    // Make the API request
    const response = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      body: formData
    });
    
    // Parse the response
    const result = await response.json();
    
    if (response.ok) {
      console.log('Product created successfully:', result);
    } else {
      console.error('Error creating product:', result);
    }
    
    return result;
  } catch (error) {
    console.error('Error in test script:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testProductCreation().then(result => {
  console.log('Test completed with result:', result);
});
