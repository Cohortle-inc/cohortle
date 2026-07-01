#!/usr/bin/env node

/**
 * Production Build Script
 * Ensures clean production builds without development artifacts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// Set production environment
process.env.NODE_ENV = 'production';

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('rm -rf .next', { stdio: 'inherit' });
  execSync('rm -rf out', { stdio: 'inherit' });
} catch (error) {
  // Ignore errors if directories don't exist
}

// Ensure production environment file exists
const prodEnvPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(prodEnvPath)) {
  console.log('⚠️  Creating .env.production file...');
  const prodEnvContent = `# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.cohortle.com
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
NEXT_PUBLIC_DISABLE_WEBSOCKET=true
`;
  fs.writeFileSync(prodEnvPath, prodEnvContent);
}

// Run the build
console.log('🔨 Building application...');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_PUBLIC_DISABLE_WEBSOCKET: 'true'
    }
  });
  console.log('✅ Production build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Verify build output
const buildDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(buildDir)) {
  console.log('✅ Build directory created successfully');
  
  // Check for any development artifacts
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    console.log('✅ Static assets generated');
  }
} else {
  console.error('❌ Build directory not found');
  process.exit(1);
}

console.log('🎉 Production build ready for deployment!');