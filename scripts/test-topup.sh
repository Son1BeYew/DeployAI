#!/bin/bash

# Script để test và debug topup payment
# Usage: ./scripts/test-topup.sh [topup_id]

echo "🧪 Testing TopUp Payment System"
echo "================================"
echo ""

# Check if topup ID is provided
if [ -z "$1" ]; then
    echo "❌ Usage: ./scripts/test-topup.sh [topup_id]"
    echo ""
    echo "Example:"
    echo "  ./scripts/test-topup.sh 507f1f77bcf86cd799439011"
    exit 1
fi

TOPUP_ID=$1
BASE_URL=${BASE_URL:-http://localhost:5000}

echo "📋 TopUp ID: $TOPUP_ID"
echo "🌐 Base URL: $BASE_URL"
echo ""

# 1. Check current status
echo "1️⃣  Checking current status..."
STATUS_RESPONSE=$(curl -s "$BASE_URL/api/topup/status/$TOPUP_ID")
echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

# 2. Trigger mock callback
echo "2️⃣  Triggering mock callback..."
MOCK_RESPONSE=$(curl -s "$BASE_URL/api/topup/mock-callback/$TOPUP_ID")
echo "$MOCK_RESPONSE" | jq '.' 2>/dev/null || echo "$MOCK_RESPONSE"
echo ""

# 3. Check status again
echo "3️⃣  Checking status after callback..."
FINAL_STATUS=$(curl -s "$BASE_URL/api/topup/status/$TOPUP_ID")
echo "$FINAL_STATUS" | jq '.' 2>/dev/null || echo "$FINAL_STATUS"
echo ""

# 4. Extract userId and check balance
echo "4️⃣  Checking user balance..."
USER_ID=$(echo "$FINAL_STATUS" | jq -r '.userId' 2>/dev/null)

if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
    echo "   User ID: $USER_ID"
    
    # Get user's token (you need to provide this manually)
    if [ -n "$TOKEN" ]; then
        BALANCE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/topup/balance")
        echo "   Balance: $(echo "$BALANCE_RESPONSE" | jq -r '.balance' 2>/dev/null || echo "N/A")"
    else
        echo "   ⚠️  Set TOKEN env variable to check balance"
        echo "   Example: TOKEN=your_jwt_token ./scripts/test-topup.sh $TOPUP_ID"
    fi
else
    echo "   ⚠️  Could not extract userId from response"
fi

echo ""
echo "================================"
echo "✅ Test completed!"
echo ""
echo "💡 Tips:"
echo "  - Check server logs: docker-compose logs -f server"
echo "  - Check MongoDB: docker exec -it aistudio_server mongosh"
echo "  - Manual mark success: curl -X PUT $BASE_URL/api/topup/mark-success/$TOPUP_ID"
