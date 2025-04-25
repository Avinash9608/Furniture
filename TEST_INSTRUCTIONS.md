# Shyam Furnitures Testing Instructions

This document provides instructions for running the automated tests for the Shyam Furnitures application.

## Prerequisites

Before running the tests, make sure you have the following:

1. Node.js installed (version 14 or higher)
2. MongoDB connection string in your `.env` file
3. The application running locally or deployed to Render

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/shyam_furnitures
API_URL=https://furniture-q3nb.onrender.com
```

Replace the values with your actual MongoDB connection string and API URL.

## Available Test Scripts

### 1. Contact Messages Test

This script specifically tests the contact message functionality:

```bash
node test-contact-messages.js
```

This test verifies:
- MongoDB connection
- Direct contact message creation in MongoDB
- Contact message creation via API
- Contact message retrieval from MongoDB
- Contact message retrieval via API
- Verification that no mock data is being returned

### 2. MongoDB Connection Test

This script tests the MongoDB connection and data fetching:

```bash
node test-mongodb-connection.js
```

This test verifies:
- Direct MongoDB connection
- Basic CRUD operations
- API endpoints
- Contact message creation
- Category creation

### 3. Comprehensive Test Suite

This script runs a comprehensive test suite for the entire application:

```bash
node automated-test-suite.js
```

This test verifies:
- MongoDB connection
- API health
- Contact operations
- Category operations
- Product operations

### 4. Run All Tests

To run all tests at once, use the provided batch script:

```bash
run-all-tests.bat
```

## Test Reports

Each test script generates a detailed report in Markdown format. The reports are saved in the root directory with names like:

- `contact-messages-test-report-YYYY-MM-DD.md`
- `test-report-YYYY-MM-DD.md`

These reports contain detailed information about the test results, including:

- Test summary
- Passed tests
- Failed tests
- Warnings
- Environment information
- Next steps

## Troubleshooting

If the tests fail, check the following:

1. **MongoDB Connection**: Make sure your MongoDB connection string is correct and that your IP address is whitelisted in MongoDB Atlas.

2. **API URL**: Make sure the API URL is correct and that the application is running.

3. **Network Issues**: Check if there are any network issues that might be preventing the tests from connecting to MongoDB or the API.

4. **Timeouts**: If the tests are timing out, try increasing the timeout values in the test scripts.

5. **Error Messages**: Check the error messages in the test reports for specific issues.

## Contact

If you have any questions or issues with the tests, please contact the development team.
