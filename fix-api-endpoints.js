const fs = require('fs');
const path = require('path');

// Path to the API file
const apiFilePath = path.join(__dirname, 'client', 'src', 'utils', 'api.js');

// Read the file
console.log(`Reading file: ${apiFilePath}`);
let content = fs.readFileSync(apiFilePath, 'utf8');

// Check if the baseURL already includes /api
const baseUrlIncludesApi = content.includes('return "/api"') || 
                          content.includes('return "http://localhost:5000/api"');

console.log(`Base URL includes /api: ${baseUrlIncludesApi}`);

if (baseUrlIncludesApi) {
  // Replace all occurrences of /api/ in API endpoints
  console.log('Removing /api prefix from all endpoints...');
  
  // Define patterns to replace
  const patterns = [
    { from: 'api.post("/api/', to: 'api.post("/' },
    { from: 'api.get("/api/', to: 'api.get("/' },
    { from: 'api.put("/api/', to: 'api.put("/' },
    { from: 'api.delete("/api/', to: 'api.delete("/' },
    { from: 'api.patch("/api/', to: 'api.patch("/' },
    { from: 'await api.post("/api/', to: 'await api.post("/' },
    { from: 'await api.get("/api/', to: 'await api.get("/' },
    { from: 'await api.put("/api/', to: 'await api.put("/' },
    { from: 'await api.delete("/api/', to: 'await api.delete("/' },
    { from: 'await api.patch("/api/', to: 'await api.patch("/' },
    { from: 'return api.post("/api/', to: 'return api.post("/' },
    { from: 'return api.get("/api/', to: 'return api.get("/' },
    { from: 'return api.put("/api/', to: 'return api.put("/' },
    { from: 'return api.delete("/api/', to: 'return api.delete("/' },
    { from: 'return api.patch("/api/', to: 'return api.patch("/' },
    { from: 'return await api.post("/api/', to: 'return await api.post("/' },
    { from: 'return await api.get("/api/', to: 'return await api.get("/' },
    { from: 'return await api.put("/api/', to: 'return await api.put("/' },
    { from: 'return await api.delete("/api/', to: 'return await api.delete("/' },
    { from: 'return await api.patch("/api/', to: 'return await api.patch("/' },
  ];
  
  // Apply all replacements
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const count = (content.match(regex) || []).length;
    content = content.replace(regex, pattern.to);
    console.log(`Replaced ${count} occurrences of "${pattern.from}" with "${pattern.to}"`);
  });
  
  // Handle template literals with backticks
  const templatePatterns = [
    { from: 'api.get(`/api/', to: 'api.get(`/' },
    { from: 'api.post(`/api/', to: 'api.post(`/' },
    { from: 'api.put(`/api/', to: 'api.put(`/' },
    { from: 'api.delete(`/api/', to: 'api.delete(`/' },
    { from: 'api.patch(`/api/', to: 'api.patch(`/' },
    { from: 'await api.get(`/api/', to: 'await api.get(`/' },
    { from: 'await api.post(`/api/', to: 'await api.post(`/' },
    { from: 'await api.put(`/api/', to: 'await api.put(`/' },
    { from: 'await api.delete(`/api/', to: 'await api.delete(`/' },
    { from: 'await api.patch(`/api/', to: 'await api.patch(`/' },
    { from: 'return api.get(`/api/', to: 'return api.get(`/' },
    { from: 'return api.post(`/api/', to: 'return api.post(`/' },
    { from: 'return api.put(`/api/', to: 'return api.put(`/' },
    { from: 'return api.delete(`/api/', to: 'return api.delete(`/' },
    { from: 'return api.patch(`/api/', to: 'return api.patch(`/' },
    { from: 'return await api.get(`/api/', to: 'return await api.get(`/' },
    { from: 'return await api.post(`/api/', to: 'return await api.post(`/' },
    { from: 'return await api.put(`/api/', to: 'return await api.put(`/' },
    { from: 'return await api.delete(`/api/', to: 'return await api.delete(`/' },
    { from: 'return await api.patch(`/api/', to: 'return await api.patch(`/' },
  ];
  
  // Apply all template literal replacements
  templatePatterns.forEach(pattern => {
    const regex = new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const count = (content.match(regex) || []).length;
    content = content.replace(regex, pattern.to);
    console.log(`Replaced ${count} occurrences of "${pattern.from}" with "${pattern.to}"`);
  });
  
  // Write the updated content back to the file
  fs.writeFileSync(apiFilePath, content);
  console.log(`Updated file: ${apiFilePath}`);
  
  console.log('All API endpoints have been updated successfully!');
} else {
  console.log('Base URL does not include /api, no changes needed.');
}
