#!/bin/bash

echo "🚀 Deploying ShopScout Backend to Fly.io..."
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly CLI not found. Installing..."
    curl -L https://fly.io/install.sh | sh
    export FLYCTL_INSTALL="/home/$USER/.fly"
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

echo "✅ Fly CLI ready"
echo ""

# Deploy
echo "📦 Deploying to Fly.io..."
flyctl deploy --ha=false

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Testing API..."
curl -s "https://shopscout-api.fly.dev/health" | head -20
echo ""
echo ""
echo "🔍 Testing search endpoint..."
curl -s "https://shopscout-api.fly.dev/api/search?query=usb+cable" | grep -o '"success":[^,]*' | head -1
echo ""
echo ""
echo "✅ All done! Now reload your Chrome extension and test."
