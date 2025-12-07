#!/bin/bash

# Quick restart script for AIStudio Server on Linux/VPS
# Usage: ./restart-server.sh

echo ""
echo "========================================"
echo "  AIStudio Server Restart Script"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker version &> /dev/null; then
    echo "❌ [ERROR] Docker is not running!"
    echo ""
    echo "Please start Docker first:"
    echo "  sudo systemctl start docker"
    echo ""
    exit 1
fi

echo "✅ [OK] Docker is running"
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

echo "📍 [INFO] Current directory: $(pwd)"
echo ""

# Restart server container
echo "🔄 [INFO] Restarting server container..."
docker-compose restart server

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ [ERROR] Failed to restart server!"
    echo ""
    echo "Trying alternative method..."
    echo ""
    
    # Try stop and start
    echo "⏹️  [INFO] Stopping server..."
    docker-compose stop server
    
    echo "▶️  [INFO] Starting server..."
    docker-compose start server
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ [ERROR] Still failed. Try full rebuild:"
        echo "  docker-compose down"
        echo "  docker-compose up -d --build"
        echo ""
        exit 1
    fi
fi

echo ""
echo "✅ [SUCCESS] Server restarted!"
echo ""

# Wait for server to start
echo "⏳ [INFO] Waiting for server to start..."
sleep 5

# Check health
echo "🏥 [INFO] Checking server health..."
if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ [OK] Server is healthy!"
    echo ""
    echo "🌐 Server is running at: http://localhost:5000"
    echo "📚 API Docs: http://localhost:5000/api-docs"
    echo "🔧 Debug Tool: http://localhost/debug-topup.html"
else
    echo "⚠️  [WARNING] Server may not be ready yet"
    echo "Check logs: docker-compose logs -f server"
fi

echo ""
echo "========================================"
echo "  Restart Complete!"
echo "========================================"
echo ""
echo "💡 View logs: docker-compose logs -f server"
echo ""

