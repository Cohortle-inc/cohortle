#!/bin/bash

# Force Clean Deployment Script
# This script clears all caches and forces a clean build to resolve Server Action issues

echo "🧹 Starting force clean deployment..."

# Step 1: Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf cohortle-web/.next
rm -rf cohortle-web/node_modules/.cache

# Step 2: Clear npm cache
echo "Clearing npm cache..."
cd cohortle-web
npm cache clean --force

# Step 3: Remove node_modules and reinstall
echo "Reinstalling dependencies..."
rm -rf node_modules
npm ci

# Step 4: Clear any build artifacts
echo "Clearing build artifacts..."
rm -rf .vercel
rm -rf dist
rm -rf build

# Step 5: Force build with clean environment
echo "Building with clean environment..."
NODE_ENV=production npm run build

echo "✅ Force clean deployment complete!"
echo "📝 If deployment still fails, check platform-specific cache settings"