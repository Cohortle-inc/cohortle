/**
 * Test Deployment Verification Endpoint
 * Simple script to test the deployment verification endpoint locally
 */

const express = require('express');
const deploymentRoutes = require('./cohortle-api/routes/deployment');

// Create a simple test app
const app = express();
app.use(express.json());

// Add deployment routes
deploymentRoutes(app);

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Test the deployment endpoint:');
  console.log(`  curl http://localhost:${PORT}/v1/api/deployment/verify`);
  console.log(`  curl http://localhost:${PORT}/v1/api/deployment/health`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});
