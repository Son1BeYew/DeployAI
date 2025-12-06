#!/bin/bash

# Monitoring script for AIStudio
echo "📊 AIStudio Monitoring Dashboard"
echo "================================="
echo ""

# Function to check service health
check_health() {
    local service=$1
    local url=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "✅ $service: Healthy (HTTP $response)"
    else
        echo "❌ $service: Unhealthy (HTTP $response)"
    fi
}

# Docker containers status
echo "🐳 Docker Containers:"
docker-compose ps
echo ""

# Service health checks
echo "🏥 Health Checks:"
check_health "Backend API" "http://localhost:5000/api/health"
check_health "Frontend" "http://localhost:80"
echo ""

# Resource usage
echo "💻 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""

# Disk usage
echo "💾 Disk Usage:"
docker system df
echo ""

# Recent logs
echo "📋 Recent Logs (last 20 lines):"
docker-compose logs --tail=20
echo ""

# MongoDB status (if accessible)
echo "🗄️  Database Status:"
docker exec aistudio_server node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => { 
    console.log('✅ MongoDB: Connected'); 
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    process.exit(0); 
  })
  .catch(err => { 
    console.log('❌ MongoDB: Disconnected -', err.message); 
    process.exit(1); 
  });
" 2>/dev/null || echo "⚠️  Cannot check MongoDB status"
echo ""

# API endpoints test
echo "🔌 API Endpoints Test:"
echo -n "  /api/health: "
curl -s http://localhost:5000/api/health | jq -r '.status' 2>/dev/null || echo "Failed"

echo -n "  /api/prompts: "
curl -s http://localhost:5000/api/prompts | jq -r 'if type=="array" then "OK (\(length) items)" else "Failed" end' 2>/dev/null || echo "Failed"

echo -n "  /api/premium/plans: "
curl -s http://localhost:5000/api/premium/plans | jq -r 'if type=="array" then "OK (\(length) plans)" else "Failed" end' 2>/dev/null || echo "Failed"
echo ""

# Uptime
echo "⏱️  Uptime:"
docker-compose ps | grep "Up" | awk '{print $1, $5, $6, $7}'
echo ""

echo "================================="
echo "✅ Monitoring complete!"
echo ""
echo "💡 Tips:"
echo "  - Run 'docker-compose logs -f' for live logs"
echo "  - Run 'docker stats' for live resource monitoring"
echo "  - Visit http://localhost:5000/api-docs for API documentation"
