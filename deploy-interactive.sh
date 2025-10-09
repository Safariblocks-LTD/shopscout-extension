#!/bin/bash

# Interactive deployment script for ShopScout
# This will prompt you for the Supabase password and deploy everything

set -e

export PATH="/home/kcelestinomaria/.fly/bin:$PATH"

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║   🚀 ShopScout Production Deployment                  ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Prompt for Supabase password
echo "📝 Please enter your Supabase database password:"
echo "(Find it in: Supabase Dashboard → Settings → Database → Connection string)"
echo ""
read -sp "Password: " SUPABASE_PASSWORD
echo ""
echo ""

if [ -z "$SUPABASE_PASSWORD" ]; then
    echo "❌ Error: Password cannot be empty"
    exit 1
fi

# Optional SERP API key
echo "📝 Enter your SERP API key (or press Enter to skip):"
read -p "SERP API Key: " SERP_API_KEY
echo ""

# Deploy Main Backend
echo "════════════════════════════════════════════════════════"
echo "📦 Deploying Main Backend Server..."
echo "════════════════════════════════════════════════════════"
cd server

# Set secrets
echo "Setting secrets..."
DATABASE_URL="postgresql://postgres:${SUPABASE_PASSWORD}@db.mhzmxdgozfmrjezzpqzv.supabase.co:5432/postgres"

flyctl secrets set \
    DATABASE_URL="$DATABASE_URL" \
    NODE_ENV="production" \
    --app shopscout-api

if [ ! -z "$SERP_API_KEY" ]; then
    flyctl secrets set SERP_API_KEY="$SERP_API_KEY" --app shopscout-api
fi

# Deploy
echo ""
echo "Deploying to Fly.io..."
flyctl deploy --app shopscout-api --ha=false

echo ""
echo "✅ Main backend deployed!"
echo "   URL: https://shopscout-api.fly.dev"
echo ""

cd ..

# Deploy Auth Server
echo "════════════════════════════════════════════════════════"
echo "📦 Deploying Auth Server..."
echo "════════════════════════════════════════════════════════"
cd auth-server

# Check if app exists, create if not
if ! flyctl status --app shopscout-auth &> /dev/null; then
    echo "Creating shopscout-auth app..."
    flyctl launch --no-deploy --copy-config --name shopscout-auth --region iad --ha=false
fi

# Deploy
echo "Deploying to Fly.io..."
flyctl deploy --app shopscout-auth --ha=false

echo ""
echo "✅ Auth server deployed!"
echo "   URL: https://shopscout-auth.fly.dev"
echo ""

cd ..

# Test deployments
echo "════════════════════════════════════════════════════════"
echo "🧪 Testing Deployments..."
echo "════════════════════════════════════════════════════════"

sleep 5  # Wait for services to start

echo "Testing Main API..."
if curl -f -s https://shopscout-api.fly.dev/health > /dev/null 2>&1; then
    echo "✅ Main API is healthy"
else
    echo "⚠️  Main API health check failed (it may still be starting up)"
fi

echo "Testing Auth Server..."
if curl -f -s https://shopscout-auth.fly.dev/health > /dev/null 2>&1; then
    echo "✅ Auth Server is healthy"
else
    echo "⚠️  Auth Server health check failed (it may still be starting up)"
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "🎉 Deployment Complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Production URLs:"
echo "  • Main API: https://shopscout-api.fly.dev"
echo "  • Auth Server: https://shopscout-auth.fly.dev"
echo ""
echo "Next Steps:"
echo "  1. Build the Chrome extension: npm run build"
echo "  2. Load extension from dist/ folder in Chrome"
echo "  3. Add these domains to Firebase authorized domains:"
echo "     - shopscout-api.fly.dev"
echo "     - shopscout-auth.fly.dev"
echo ""
echo "View logs:"
echo "  flyctl logs --app shopscout-api"
echo "  flyctl logs --app shopscout-auth"
echo ""
