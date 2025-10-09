#!/bin/bash

# ShopScout Production Deployment Script
# This script deploys both backend servers to Fly.io

set -e  # Exit on error

echo "🚀 ShopScout Production Deployment"
echo "===================================="
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    export PATH="/home/kcelestinomaria/.fly/bin:$PATH"
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to prompt for secrets
prompt_for_secrets() {
    echo -e "${YELLOW}📝 We need some configuration values...${NC}"
    echo ""
    
    # Supabase Database Password
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo "Enter your Supabase database password:"
        echo "(Found in Supabase Dashboard → Settings → Database → Connection string)"
        read -sp "Password: " SUPABASE_DB_PASSWORD
        echo ""
    fi
    
    # SERP API Key (optional)
    if [ -z "$SERP_API_KEY" ]; then
        echo ""
        echo "Enter your SERP API key (or press Enter to skip for now):"
        echo "(Get one from https://serpapi.com/)"
        read -p "API Key: " SERP_API_KEY
    fi
    
    echo ""
}

# Deploy Main Backend Server
deploy_main_server() {
    echo -e "${GREEN}📦 Deploying Main Backend Server...${NC}"
    cd server
    
    # Set secrets
    echo "Setting environment secrets..."
    DATABASE_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.mhzmxdgozfmrjezzpqzv.supabase.co:5432/postgres"
    
    flyctl secrets set \
        DATABASE_URL="$DATABASE_URL" \
        SUPABASE_URL="https://mhzmxdgozfmrjezzpqzv.supabase.co" \
        SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oem14ZGdvemZtcmplenpwcXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjA1NDIsImV4cCI6MjA3NTUzNjU0Mn0._b8GodKnkYRrfnEbgt_e-is7FnIlnR8k2ay1IazZt-Y" \
        NODE_ENV="production" \
        --app shopscout-api
    
    if [ ! -z "$SERP_API_KEY" ]; then
        flyctl secrets set SERP_API_KEY="$SERP_API_KEY" --app shopscout-api
    fi
    
    # Deploy
    echo "Deploying to Fly.io..."
    flyctl deploy --app shopscout-api
    
    echo -e "${GREEN}✅ Main server deployed!${NC}"
    echo "URL: https://shopscout-api.fly.dev"
    echo ""
    
    cd ..
}

# Deploy Auth Server
deploy_auth_server() {
    echo -e "${GREEN}📦 Deploying Auth Server...${NC}"
    cd auth-server
    
    # Launch app if it doesn't exist
    if ! flyctl status --app shopscout-auth &> /dev/null; then
        echo "Creating shopscout-auth app..."
        flyctl launch --no-deploy --copy-config --name shopscout-auth
    fi
    
    # Deploy
    echo "Deploying to Fly.io..."
    flyctl deploy --app shopscout-auth
    
    echo -e "${GREEN}✅ Auth server deployed!${NC}"
    echo "URL: https://shopscout-auth.fly.dev"
    echo ""
    
    cd ..
}

# Test deployments
test_deployments() {
    echo -e "${GREEN}🧪 Testing Deployments...${NC}"
    echo ""
    
    echo "Testing Main API..."
    if curl -f -s https://shopscout-api.fly.dev/health > /dev/null; then
        echo -e "${GREEN}✅ Main API is healthy${NC}"
    else
        echo -e "${RED}❌ Main API health check failed${NC}"
    fi
    
    echo "Testing Auth Server..."
    if curl -f -s https://shopscout-auth.fly.dev/health > /dev/null; then
        echo -e "${GREEN}✅ Auth Server is healthy${NC}"
    else
        echo -e "${RED}❌ Auth Server health check failed${NC}"
    fi
    
    echo ""
}

# Main deployment flow
main() {
    prompt_for_secrets
    
    echo ""
    echo "Starting deployment..."
    echo ""
    
    deploy_main_server
    deploy_auth_server
    test_deployments
    
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update Chrome extension configuration with production URLs"
    echo "2. Add these domains to Firebase authorized domains:"
    echo "   - shopscout-api.fly.dev"
    echo "   - shopscout-auth.fly.dev"
    echo "3. Build the extension: npm run build"
    echo "4. Load the extension from the dist/ folder"
    echo ""
    echo "Production URLs:"
    echo "  Main API: https://shopscout-api.fly.dev"
    echo "  Auth Server: https://shopscout-auth.fly.dev"
    echo ""
}

# Run main function
main
