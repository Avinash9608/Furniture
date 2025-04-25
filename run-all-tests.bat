@echo off
echo ===================================
echo Running All Tests for Shyam Furnitures
echo ===================================

echo.
echo Running Contact Messages Test...
node test-contact-messages.js
echo.

echo Running MongoDB Connection Test...
node test-mongodb-connection.js
echo.

echo Running Comprehensive Test Suite...
node automated-test-suite.js
echo.

echo ===================================
echo All Tests Completed
echo ===================================
