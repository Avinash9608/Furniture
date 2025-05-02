// Test script for admin login
async function testAdminLogin() {
  try {
    console.log("Testing admin login with hardcoded credentials...");

    const credentials = {
      email: "avinashmadhukar4@gmail.com",
      password: "123456",
    };

    console.log("Using credentials:", credentials);

    const response = await fetch("http://localhost:5000/api/auth/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    console.log("Response:", data);

    if (response.ok) {
      console.log("Admin login successful!");
    } else {
      console.error("Admin login failed:", data.message);
    }
  } catch (error) {
    console.error("Error testing admin login:", error);
  }
}

testAdminLogin();
