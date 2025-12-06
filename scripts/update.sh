#!/bin/bash

# Update script for AIStudio
echo "🔄 Updating AIStudio..."

# Backup before update
echo "📦 Creating backup before update..."
./scripts/backup.sh

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Update dependencies
echo "📦 Updating dependencies..."
cd Server
npm install
cd ..

# Rebuild and restart containers
echo "🔨 Rebuilding containers..."
docker-compose down
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo "🏥 Checking health..."
curl -s http://localhost:5000/api/health | jq '.' || echo "Health check failed"

# Show logs
echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=50

echo ""
echo "✅ Update complete!"
echo "🌐 Frontend: http://localhost"
echo "📚 API Docs: http://localhost:5000/api-docs"
