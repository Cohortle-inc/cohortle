#!/bin/bash

# Setup script for Cloudflare cache automation

echo "🚀 Setting up Cloudflare cache automation..."

# Make purge script executable
chmod +x purge-cloudflare-cache.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Get your Cloudflare API token:"
echo "   - Go to https://dash.cloudflare.com/"
echo "   - Profile → API Tokens → Create Token"
echo "   - Use 'Edit zone DNS' template or custom with Cache Purge permission"
echo ""
echo "2. For GitHub Actions (Recommended):"
echo "   - Go to your GitHub repo → Settings → Secrets"
echo "   - Add secret: CLOUDFLARE_API_TOKEN"
echo "   - The workflow will run automatically on push to main"
echo ""
echo "3. For manual use:"
echo "   export CLOUDFLARE_API_TOKEN='your_token_here'"
echo "   ./purge-cloudflare-cache.sh"
echo ""
echo "📖 See CLOUDFLARE_CACHE_AUTOMATION.md for full documentation"
