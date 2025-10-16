#!/bin/bash

# ShopScout Production Testing Script
# Tests all components to ensure production readiness

echo "🧪 ShopScout Production Testing"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health
echo "1️⃣  Testing Backend Health..."
HEALTH=$(curl -s https://shopscout-api.fly.dev/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    echo "   Response: $HEALTH"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "   Response: $HEALTH"
fi
echo ""

# Test 2: Serper.dev API Test
echo "2️⃣  Testing Serper.dev API..."
SERPER_TEST=$(curl -s https://shopscout-api.fly.dev/api/test-serper)
if echo "$SERPER_TEST" | grep -q "success"; then
    echo -e "${GREEN}✅ Serper.dev API is working${NC}"
    echo "   Response: $SERPER_TEST"
else
    echo -e "${YELLOW}⚠️  Serper.dev API test response:${NC}"
    echo "   $SERPER_TEST"
    echo -e "${YELLOW}   Note: If API key not configured, update it on Fly.io${NC}"
fi
echo ""

# Test 3: Search Endpoint
echo "3️⃣  Testing Search Endpoint..."
SEARCH=$(curl -s "https://shopscout-api.fly.dev/api/search?query=usb+cable" | head -c 200)
if echo "$SEARCH" | grep -q "results"; then
    echo -e "${GREEN}✅ Search endpoint is working${NC}"
    echo "   Response preview: ${SEARCH}..."
else
    echo -e "${YELLOW}⚠️  Search endpoint response:${NC}"
    echo "   ${SEARCH}..."
fi
echo ""

# Test 4: Auth Frontend
echo "4️⃣  Testing Auth Frontend..."
AUTH=$(curl -s -o /dev/null -w "%{http_code}" https://shopscout-auth.fly.dev)
if [ "$AUTH" = "200" ]; then
    echo -e "${GREEN}✅ Auth frontend is accessible (HTTP $AUTH)${NC}"
else
    echo -e "${RED}❌ Auth frontend returned HTTP $AUTH${NC}"
fi
echo ""

# Test 5: Extension Build
echo "5️⃣  Checking Extension Build..."
if [ -d "dist" ] && [ -f "dist/manifest.json" ]; then
    echo -e "${GREEN}✅ Extension is built${NC}"
    echo "   Location: $(pwd)/dist"
    
    # Check manifest version
    VERSION=$(grep -o '"version": "[^"]*"' dist/manifest.json | cut -d'"' -f4)
    echo "   Version: $VERSION"
    
    # Check file sizes
    if [ -f "dist/sidepanel.js" ]; then
        SIZE=$(du -h dist/sidepanel.js | cut -f1)
        echo "   Sidepanel size: $SIZE"
    fi
    if [ -f "dist/background.js" ]; then
        SIZE=$(du -h dist/background.js | cut -f1)
        echo "   Background size: $SIZE"
    fi
else
    echo -e "${RED}❌ Extension not built${NC}"
    echo "   Run: npm run build"
fi
echo ""

# Test 6: Chrome AI Code Compliance
echo "6️⃣  Verifying Chrome AI Code Compliance..."
if grep -q "summarizeStreaming(productContext, {" background.js; then
    echo -e "${GREEN}✅ Chrome AI code follows official docs${NC}"
    echo "   Pattern: summarizeStreaming(text, {context})"
else
    echo -e "${YELLOW}⚠️  Chrome AI code pattern not found${NC}"
fi
echo ""

# Test 7: Serper.dev Code Compliance
echo "7️⃣  Verifying Serper.dev Code Compliance..."
if grep -q "google.serper.dev/shopping" server/index.js; then
    echo -e "${GREEN}✅ Serper.dev code follows official docs${NC}"
    echo "   Endpoint: google.serper.dev/shopping"
fi
if grep -q "X-API-KEY" server/index.js; then
    echo -e "${GREEN}✅ API key header correct${NC}"
    echo "   Header: X-API-KEY"
fi
echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo ""
echo "Backend Services:"
echo "  • Health: Check above"
echo "  • Serper.dev: Check above"
echo "  • Search: Check above"
echo "  • Auth: Check above"
echo ""
echo "Extension:"
echo "  • Build: Check above"
echo "  • Chrome AI: Check above"
echo ""
echo "Next Steps:"
echo "  1. Update API key on Fly.io (see UPDATE_API_KEY.md)"
echo "  2. Load extension in Chrome (chrome://extensions/)"
echo "  3. Test on Amazon product page"
echo "  4. Verify 3-phase workflow"
echo ""
echo "Documentation:"
echo "  • OFFICIAL_DOCS_COMPLIANCE.md - Code compliance"
echo "  • REAL_TIME_AI_STREAMING.md - Technical details"
echo "  • QUICK_TESTING_GUIDE.md - Testing walkthrough"
echo "  • UPDATE_API_KEY.md - API key instructions"
echo ""
echo "🎉 Testing complete!"
