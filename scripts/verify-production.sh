#!/bin/bash

# Production Verification Script
# Verifies that all services are running correctly in production

echo "🔍 Verifying AIStudio Production Deployment"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Function to check
check() {
    local description=$1
    local command=$2
    
    echo -n "Checking $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((ERRORS++))
    fi
}

# 1. Docker Containers
echo "🐳 Docker Containers"
echo "-------------------"
check "Server container running" "docker ps | grep aistudio_server"
check "Client container running" "docker ps | grep aistudio_client"
echo ""

# 2. Network Connectivity
echo "🌐 Network Connectivity"
echo "----------------------"
check "Server port 5000 accessible" "curl -s http://localhost:5000/api/health > /dev/null"
check "Client port 80 accessible" "curl -s http://localhost > /dev/null"
echo ""

# 3. API Health
echo "🏥 API Health Checks"
echo "-------------------"
check "Health endpoint" "curl -s http://localhost:5000/api/health | grep -q 'ok'"
check "API docs accessible" "curl -s http://localhost:5000/api-docs | grep -q 'swagger'"
check "Prompts API" "curl -s http://localhost:5000/api/prompts | grep -q '\['"
check "Premium plans API" "curl -s http://localhost:5000/api/premium/plans | grep -q '\['"
echo ""

# 4. Database Connection
echo "🗄️  Database Connection"
echo "----------------------"
check "MongoDB connection" "docker exec aistudio_server node -e \"require('mongoose').connect(process.env.MONGO_URI).then(() => process.exit(0)).catch(() => process.exit(1))\""
echo ""

# 5. File System
echo "📁 File System"
echo "-------------"
check "Outputs directory exists" "docker exec aistudio_server test -d /app/outputs"
check "Config directory exists" "docker exec aistudio_server test -d /app/config"
echo ""

# 6. Environment Variables
echo "⚙️  Environment Variables"
echo "------------------------"
check "MONGO_URI set" "docker exec aistudio_server printenv MONGO_URI > /dev/null"
check "JWT_SECRET set" "docker exec aistudio_server printenv JWT_SECRET > /dev/null"
check "CLOUDINARY configured" "docker exec aistudio_server printenv CLOUDINARY_CLOUD_NAME > /dev/null"
echo ""

# 7. Nginx Configuration
echo "🔧 Nginx Configuration"
echo "---------------------"
check "Nginx config valid" "docker exec aistudio_client nginx -t"
check "Nginx running" "docker exec aistudio_client pgrep nginx"
echo ""

# 8. Logs Check
echo "📋 Recent Logs Check"
echo "-------------------"
echo "Server logs (last 5 lines):"
docker-compose logs --tail=5 server | tail -5
echo ""
echo "Client logs (last 5 lines):"
docker-compose logs --tail=5 client | tail -5
echo ""

# Summary
echo "==========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Production is ready.${NC}"
else
    echo -e "${RED}❌ $ERRORS check(s) failed. Please review above.${NC}"
fi
echo ""

# Additional Info
echo "📊 Container Stats:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

echo "💡 Next Steps:"
if [ $ERRORS -eq 0 ]; then
    echo "  1. Test all features in browser"
    echo "  2. Monitor logs: docker-compose logs -f"
    echo "  3. Setup monitoring and alerts"
    echo "  4. Configure SSL if not done"
else
    echo "  1. Review failed checks above"
    echo "  2. Check logs: docker-compose logs"
    echo "  3. Verify .env configuration"
    echo "  4. Restart services if needed"
fi

exit $ERRORS
