// Import the API functions
import { productsAPI, categoriesAPI, contactAPI, ordersAPI } from './api';

// Test the API functions
async function testAPI() {
  try {
    console.log('Testing productsAPI.getAll()...');
    const productsResponse = await productsAPI.getAll();
    console.log('Products response:', productsResponse);

    console.log('Testing categoriesAPI.getAll()...');
    const categoriesResponse = await categoriesAPI.getAll();
    console.log('Categories response:', categoriesResponse);

    console.log('Testing ordersAPI.getAll()...');
    const ordersResponse = await ordersAPI.getAll();
    console.log('Orders response:', ordersResponse);

    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testAPI();
