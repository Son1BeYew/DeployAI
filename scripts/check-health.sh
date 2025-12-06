#!/bin/bash

# Health check script
echo "🏥 Checking AIStudio health..."

# Check if containers are running
echo ""
echo "📦 Docker Containers:"
docker-compose ps

# Check backend health
echo ""
echo "🔍 Backend Health Check:"
HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)
if [ $? -eq 0 ]; then
    echo "✅ Backend is healthy"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ Backend is not responding"
fi

# Check frontend
echo ""
echo "🌐 Frontend Check:"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend is accessible (HTTP $FRONTEND_RESPONSE)"
else
    echo "❌ Frontend is not accessible (HTTP $FRONTEND_RESPONSE)"
fi

# Check MongoDB connection
echo ""
echo "🗄️  Database Check:"
docker exec aistudio_server node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => { console.log('✅ MongoDB connected'); process.exit(0); })
  .catch(err => { console.log('❌ MongoDB connection failed:', err.message); process.exit(1); });
" 2>/dev/null

# Check disk usage
echo ""
echo "💾 Disk Usage:"
docker system df

echo ""
echo "✅ Health check complete!"
