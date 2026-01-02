const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all files in the project root (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for SPA-style routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SnarkyType server running: http://localhost:${PORT}`);
});
