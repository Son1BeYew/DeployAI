#!/bin/bash

# API Testing Script for AIStudio
# Tests all major API endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL - change this for production
BASE_URL="${1:-http://localhost:5000}"

echo "🧪 Testing AIStudio APIs"
echo "Base URL: $BASE_URL"
echo "================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local auth=$4
    
    echo -n "Testing $description... "
    
    if [ -z "$auth" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" -H "Authorization: Bearer $auth")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
    elif [ "$response" = "401" ]; then
        echo -e "${YELLOW}⚠ AUTH REQUIRED${NC} (HTTP $response)"
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response)"
    fi
}

# Public Endpoints (No Auth Required)
echo "📖 Public Endpoints"
echo "-------------------"
test_endpoint "GET" "/api/health" "Health Check"
test_endpoint "GET" "/api-docs" "API Documentation"
test_endpoint "GET" "/api/prompts" "Get Prompts"
test_endpoint "GET" "/api/prompts-trending" "Get Trending Prompts"
test_endpoint "GET" "/api/premium/plans" "Get Premium Plans"
test_endpoint "GET" "/api/announcements" "Get Announcements"
test_endpoint "GET" "/api/outfit-styles?gender=male" "Get Outfit Styles"
test_endpoint "GET" "/api/trends/stats" "Get Trends Stats"
test_endpoint "GET" "/api/collections" "Get Collections"
echo ""

# Authentication Endpoints
echo "🔐 Authentication Endpoints"
echo "---------------------------"
test_endpoint "POST" "/auth/register" "Register (needs body)"
test_endpoint "POST" "/auth/login" "Login (needs body)"
test_endpoint "GET" "/auth/google" "Google OAuth"
test_endpoint "POST" "/auth/refresh-token" "Refresh Token (needs body)"
echo ""

# Protected Endpoints (Require Auth)
echo "🔒 Protected Endpoints (Auth Required)"
echo "--------------------------------------"
test_endpoint "GET" "/protected" "Protected Route"
test_endpoint "GET" "/api/profile/me" "Get Profile"
test_endpoint "GET" "/api/history" "Get History"
test_endpoint "GET" "/api/premium/current" "Get Current Premium"
test_endpoint "GET" "/api/ai/daily-quota" "Get Daily Quota"
test_endpoint "POST" "/api/ai/generate" "Generate Image (needs body)"
test_endpoint "POST" "/api/chat/send" "Send Chat Message (needs body)"
echo ""

# Admin Endpoints (Require Admin Auth)
echo "👨‍💼 Admin Endpoints (Admin Auth Required)"
echo "----------------------------------------"
test_endpoint "GET" "/api/admin/dashboard-stats" "Dashboard Stats"
test_endpoint "GET" "/api/admin/overview-stats" "Overview Stats"
test_endpoint "GET" "/api/admin/users" "Get Users"
test_endpoint "GET" "/api/admin/top-prompts" "Top Prompts"
test_endpoint "GET" "/api/admin/wallet-stats" "Wallet Stats"
echo ""

# Summary
echo "================================="
echo "✅ API Testing Complete!"
echo ""
echo "💡 Notes:"
echo "  - ✓ OK: Endpoint is working"
echo "  - ⚠ AUTH REQUIRED: Endpoint requires authentication (expected)"
echo "  - ✗ FAILED: Endpoint is not working"
echo ""
echo "📚 For detailed API documentation, visit:"
echo "   $BASE_URL/api-docs"
echo ""
echo "🔑 To test authenticated endpoints, get a token by:"
echo "   1. Register/Login via API or UI"
echo "   2. Use the token in Authorization header"
echo "   3. Run: TOKEN='your-token' ./test-apis.sh"
