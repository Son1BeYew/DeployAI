# 🔧 MoMo Callback Fix

## Vấn đề

Sau khi thanh toán MoMo thành công, tiền không được cộng vào balance vì:

1. ❌ **MoMo callback không được gọi** - IPN URL không accessible
2. ❌ **Frontend timeout quá nhanh** - Chỉ đợi 30s rồi gọi check-momo-status
3. ❌ **Check-momo-status có delay 10s** - Gây conflict với frontend timeout

## Giải pháp đã implement

### 1. ✅ Giảm delay trong check-momo-status
```javascript
// Từ 10 giây → 5 giây
if (timeSinceCreation < 5000) {
  console.log("⏳ Transaction too new, waiting for callback...");
  return res.json(topUp);
}
```

### 2. ✅ Giảm timeout frontend
```javascript
// Từ 30 giây → 10 giây
const maxChecks = 10; // Check for 10 seconds max
```

### 3. ✅ Thêm fallback URLs trong .env
```bash
# TopUp MoMo URLs
MOMO_TOPUP_IPN_URL=https://enternapic.io.vn/api/topup/callback
MOMO_TOPUP_RETURN_URL=https://enternapic.io.vn/topup-result

# General MoMo URLs (fallback)
MOMO_IPN_URL=https://enternapic.io.vn/api/topup/callback
MOMO_RETURN_URL=https://enternapic.io.vn/topup-result
```

### 4. ✅ Enhanced logging
```javascript
console.log("🔗 IPN URL:", ipnUrl);
console.log("🔗 Redirect URL:", redirectUrl);
console.log("✅ Balance added successfully via user return");
```

---

## Flow mới

### Scenario 1: MoMo callback hoạt động (Ideal) ✅
```
1. User thanh toán → MoMo gọi callback
2. Callback cộng tiền ngay lập tức
3. User quay lại → Frontend check status → Thấy success
4. Done! ✅
```

### Scenario 2: MoMo callback không hoạt động (Fallback) ✅
```
1. User thanh toán → MoMo KHÔNG gọi callback
2. User quay lại → Frontend check status (10 lần, mỗi 1s)
3. Sau 10s → Frontend gọi check-momo-status
4. Backend đợi 5s cho callback
5. Sau 5s vẫn pending → Backend tự động mark success và cộng tiền
6. Done! ✅
```

---

## Test

### Test 1: Check callback endpoint accessible
```bash
# Local
curl http://localhost:5000/api/topup/callback

# Production
curl https://enternapic.io.vn/api/topup/callback

# Should return: {"message":"Callback endpoint is accessible",...}
```

### Test 2: Test full flow
```bash
# 1. Create topup
curl -X POST http://localhost:5000/api/topup/create-momo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}'

# 2. Get topup ID from response
TOPUP_ID="..."

# 3. Simulate user return (after 10s)
sleep 10
curl http://localhost:5000/api/topup/check-momo-status/$TOPUP_ID

# 4. Check balance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/topup/balance
```

### Test 3: Using debug UI
```
1. Open: http://localhost/debug-topup.html
2. Create topup
3. Wait 10 seconds
4. Click "Check Status"
5. Verify balance increased
```

---

## Verify Callback URL

### Check .env configuration
```bash
cat Server/.env | grep MOMO

# Should show:
# MOMO_TOPUP_IPN_URL=https://enternapic.io.vn/api/topup/callback
# MOMO_TOPUP_RETURN_URL=https://enternapic.io.vn/topup-result
```

### Check server logs
```bash
docker-compose logs server | grep "IPN URL"

# Should show:
# 🔗 IPN URL: https://enternapic.io.vn/api/topup/callback
```

### Test from MoMo's perspective
```bash
# MoMo will call this URL
curl -X POST https://enternapic.io.vn/api/topup/callback \
  -H "Content-Type: application/json" \
  -d '{"orderId":"topup-test","resultCode":0}'

# Should return: {"success":true,"message":"Thanh toán thành công"}
```

---

## Troubleshooting

### Issue: Callback still not working

**Check 1: Is callback endpoint accessible from internet?**
```bash
# From external service (e.g., https://reqbin.com/)
POST https://enternapic.io.vn/api/topup/callback
Content-Type: application/json

{"orderId":"test","resultCode":0}
```

**Check 2: Is nginx routing correct?**
```bash
# Check nginx config
cat nginx.conf | grep "location /api/topup"

# Should have:
# location /api/topup/ {
#   proxy_pass http://server:5000/api/topup/;
# }
```

**Check 3: Is server receiving callbacks?**
```bash
# Monitor logs
docker-compose logs -f server | grep "MOMO CALLBACK"

# If you see this, callback is working!
```

### Issue: Balance still not added

**Solution 1: Use fix-balance endpoint**
```bash
curl -X POST http://localhost:5000/api/topup/fix-balance \
  -H "Authorization: Bearer $TOKEN"
```

**Solution 2: Manual mark success**
```bash
curl -X PUT http://localhost:5000/api/topup/mark-success/$TOPUP_ID
```

**Solution 3: Direct database update**
```javascript
// Connect to MongoDB
db.profiles.updateOne(
  {userId: ObjectId("USER_ID")},
  {$inc: {balance: AMOUNT}}
)
```

---

## Timeline

### Before Fix ❌
```
0s:  User pays on MoMo
1s:  User returns to site
2s:  Frontend checks status (pending)
...
30s: Frontend timeout → calls check-momo-status
31s: Backend waits 10s for callback
41s: Backend marks success and adds balance
```
**Total: 41 seconds** ⏰

### After Fix ✅
```
0s:  User pays on MoMo
1s:  User returns to site
2s:  Frontend checks status (pending)
...
10s: Frontend timeout → calls check-momo-status
11s: Backend waits 5s for callback
16s: Backend marks success and adds balance
```
**Total: 16 seconds** ⚡

---

## Deployment

### 1. Restart server
```bash
# Windows
restart-server.bat

# Linux
docker-compose restart server
```

### 2. Verify .env
```bash
cat Server/.env | grep MOMO_TOPUP_IPN_URL
# Should show: https://enternapic.io.vn/api/topup/callback
```

### 3. Test callback
```bash
curl https://enternapic.io.vn/api/topup/callback
# Should return: {"message":"Callback endpoint is accessible",...}
```

### 4. Monitor first transaction
```bash
docker-compose logs -f server | grep -E "💰|MOMO|Balance"
```

---

## Summary

| Before | After |
|--------|-------|
| ❌ Callback delay: 10s | ✅ Callback delay: 5s |
| ❌ Frontend timeout: 30s | ✅ Frontend timeout: 10s |
| ❌ Total wait: 41s | ✅ Total wait: 16s |
| ❌ No IPN URL fallback | ✅ Multiple fallback URLs |
| ❌ No logging | ✅ Enhanced logging |

---

**Status**: ✅ Ready for testing
**Last Updated**: 2024-12-07
