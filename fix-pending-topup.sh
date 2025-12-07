#!/bin/bash

# Fix Pending Topup Script
# Usage: ./fix-pending-topup.sh [TOPUP_ID]

TOPUP_ID=$1
API_URL="http://localhost:5000"

if [ -z "$TOPUP_ID" ]; then
  echo "❌ Error: Missing TOPUP_ID"
  echo ""
  echo "Usage: ./fix-pending-topup.sh TOPUP_ID"
  echo ""
  echo "To get TOPUP_ID:"
  echo "1. Open browser console (F12)"
  echo "2. Run: localStorage.getItem('token')"
  echo "3. Copy token"
  echo "4. Run: curl http://localhost:5000/api/topup/history -H 'Authorization: Bearer TOKEN'"
  echo "5. Find the pending transaction ID"
  exit 1
fi

echo "🔧 Fixing Pending Topup"
echo "======================"
echo "Topup ID: ${TOPUP_ID}"
echo ""

# Step 1: Check current status
echo "📊 Step 1: Checking current status..."
STATUS_RESPONSE=$(curl -s ${API_URL}/api/topup/status/${TOPUP_ID})
echo "Response: ${STATUS_RESPONSE}"
echo ""

# Extract status
CURRENT_STATUS=$(echo ${STATUS_RESPONSE} | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "Current status: ${CURRENT_STATUS}"
echo ""

if [ "$CURRENT_STATUS" = "success" ]; then
  echo "✅ Already marked as success!"
  echo ""
  echo "If balance is still not updated, run fix-balance:"
  echo "  curl -X POST ${API_URL}/api/topup/fix-balance -H 'Authorization: Bearer YOUR_TOKEN'"
  exit 0
fi

# Step 2: Mark as success
echo "🔄 Step 2: Marking as success..."
MARK_RESPONSE=$(curl -s -X PUT ${API_URL}/api/topup/mark-success/${TOPUP_ID})
echo "Response: ${MARK_RESPONSE}"
echo ""

# Step 3: Verify
echo "✅ Step 3: Verifying..."
sleep 1
VERIFY_RESPONSE=$(curl -s ${API_URL}/api/topup/status/${TOPUP_ID})
echo "Response: ${VERIFY_RESPONSE}"
echo ""

NEW_STATUS=$(echo ${VERIFY_RESPONSE} | grep -o '"status":"[^"]*' | cut -d'"' -f4)
echo "New status: ${NEW_STATUS}"
echo ""

if [ "$NEW_STATUS" = "success" ]; then
  echo "✅ SUCCESS! Topup marked as success"
  echo ""
  echo "Next steps:"
  echo "1. Reload topup.html page"
  echo "2. Check if balance is updated"
  echo "3. If not, run fix-balance API"
else
  echo "❌ Failed to mark as success"
  echo ""
  echo "Try manual API call:"
  echo "  curl -X PUT ${API_URL}/api/topup/mark-success/${TOPUP_ID}"
fi

echo ""
echo "Done!"

