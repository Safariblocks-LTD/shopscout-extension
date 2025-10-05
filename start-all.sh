#!/bin/bash

# ShopScout - Start All Servers
# This script starts both the auth server and backend server

echo "🚀 Starting ShopScout Servers..."
echo ""

# Start auth server in background
echo "📝 Starting Authentication Server (Port 8000)..."
cd auth-server
npm start &
AUTH_PID=$!
cd ..

# Wait a moment
sleep 2

# Start backend server in background
echo "📝 Starting Backend Server (Port 3001)..."
cd server
node index.js &
BACKEND_PID=$!
cd ..

echo ""
echo "✅ All servers started!"
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║   🛍️  ShopScout - All Systems Running                ║"
echo "║                                                       ║"
echo "║   Auth Server:    http://localhost:8000              ║"
echo "║   Backend Server: http://localhost:3001              ║"
echo "║                                                       ║"
echo "║   Press Ctrl+C to stop all servers                   ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all servers..."
    kill $AUTH_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
