#!/bin/bash

# Stop all AIStudio services
echo "⏹️  Stopping all AIStudio services..."

# Stop Docker containers
if [ -f "docker-compose.yml" ]; then
    echo "Stopping Docker containers..."
    docker-compose down
fi

# Kill any Node.js processes on port 5000
echo "Killing processes on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Kill any http-server processes on port 8080
echo "Killing processes on port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped!"
