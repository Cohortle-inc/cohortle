/**
 * Deployment Verification Routes
 * Provides endpoints to verify deployment status and version
 */

const fs = require('fs');
const path = require('path');

module.exports = (app) => {
  /**
   * @swagger
   * /v1/api/deployment/verify:
   *   get:
   *     summary: Verify deployment status
   *     description: Returns deployment information including build timestamp and version markers
   *     tags: [Deployment]
   *     responses:
   *       200:
   *         description: Deployment information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 deployed: 
   *                   type: boolean
   *                 buildTimestamp:
   *                   type: string
   *                 version:
   *                   type: string
   *                 environment:
   *                   type: string
   *                 codeMarkers:
   *                   type: array
   *                   items:
   *                     type: object
   */
  app.get('/v1/api/deployment/verify', (req, res) => {
    try {
      // Read deployment info from file if it exists
      const deploymentInfoPath = path.join(__dirname, '../deployment-info.json');
      let deploymentInfo = {
        deployed: true,
        buildTimestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        codeMarkers: []
      };

      // Try to read deployment info file
      if (fs.existsSync(deploymentInfoPath)) {
        const fileContent = fs.readFileSync(deploymentInfoPath, 'utf8');
        deploymentInfo = { ...deploymentInfo, ...JSON.parse(fileContent) };
      }

      // Add code markers from key files
      const codeMarkers = [];
      
      // Check app.js for deployment marker
      const appJsPath = path.join(__dirname, '../app.js');
      if (fs.existsSync(appJsPath)) {
        const appJsContent = fs.readFileSync(appJsPath, 'utf8');
        const markerMatch = appJsContent.match(/\/\/ DEPLOYMENT_MARKER: (.+)/);
        if (markerMatch) {
          codeMarkers.push({
            file: 'app.js',
            marker: markerMatch[1]
          });
        }
      }

      // Check programme routes for deployment marker
      const programmeRoutesPath = path.join(__dirname, 'programme.js');
      if (fs.existsSync(programmeRoutesPath)) {
        const programmeContent = fs.readFileSync(programmeRoutesPath, 'utf8');
        const markerMatch = programmeContent.match(/\/\/ DEPLOYMENT_MARKER: (.+)/);
        if (markerMatch) {
          codeMarkers.push({
            file: 'routes/programme.js',
            marker: markerMatch[1]
          });
        }
      }

      deploymentInfo.codeMarkers = codeMarkers;

      res.json(deploymentInfo);
    } catch (error) {
      console.error('Error verifying deployment:', error);
      res.status(500).json({
        error: true,
        message: 'Failed to verify deployment',
        details: error.message
      });
    }
  });

  /**
   * @swagger
   * /v1/api/deployment/health:
   *   get:
   *     summary: Deployment health check
   *     description: Simple health check endpoint for deployment verification
   *     tags: [Deployment]
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  app.get('/v1/api/deployment/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
};
