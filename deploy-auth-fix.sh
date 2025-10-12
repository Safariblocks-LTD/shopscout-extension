#!/bin/bash

# ShopScout Auth Server Deployment Script
# This script deploys the fixed auth server to Fly.io

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   🚀 ShopScout Auth Server Deployment                ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check if flyctl is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Error: flyctl is not installed"
    echo "Please install it from: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

echo "✅ flyctl is installed"
echo ""

# Navigate to auth-server directory
echo "📁 Navigating to auth-server directory..."
cd auth-server

# Check if fly.toml exists
if [ ! -f "fly.toml" ]; then
    echo "❌ Error: fly.toml not found"
    echo "Please make sure you're in the correct directory"
    exit 1
fi

echo "✅ fly.toml found"
echo ""

# Show current status
echo "📊 Current deployment status:"
fly status || echo "⚠️  App might not be deployed yet"
echo ""

# Deploy
echo "🚀 Deploying to Fly.io..."
echo ""
fly deploy

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   ✅ Deployment Complete!                            ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Show final status
echo "📊 Deployment status:"
fly status

echo ""
echo "🔍 Recent logs:"
fly logs --lines 20

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   Next Steps:                                         ║"
echo "║                                                       ║"
echo "║   1. Rebuild the extension: npm run build            ║"
echo "║   2. Load the extension from the 'dist' folder       ║"
echo "║   3. Test authentication flow                        ║"
echo "║                                                       ║"
echo "║   Auth URL: https://shopscout-auth.fly.dev          ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
