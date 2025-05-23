const express = require("express");
const path = require("path");

const app = express();
const PORT = 9090;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
