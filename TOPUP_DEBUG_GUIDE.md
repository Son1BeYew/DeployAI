# 🔧 Hướng dẫn Debug Topup Payment

## Vấn đề: Tiền không được cộng sau khi thanh toán

### Nguyên nhân chính đã fix:

1. ✅ **Duplicate logic cộng tiền** - Đã tạo helper function `addBalanceToProfile()`
2. ✅ **Race condition** - Đã thêm check để tránh xử lý duplicate
3. ✅ **Profile chưa tồn tại** - Đã tự động tạo Profile nếu chưa có
4. ✅ **Callback timing** - Đã thêm delay 10s trước khi frontend tự mark success

---

## Cách test thanh toán

### 1. Test với Mock Callback (Development)

```bash
# Lấy topup ID từ response khi tạo payment
TOPUP_ID="your_topup_id_here"

# Trigger mock callback
curl http://localhost:5000/api/topup/mock-callback/$TOPUP_ID

# Check status
curl http://localhost:5000/api/topup/status/$TOPUP_ID

# Check balance (cần token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/topup/balance
```

### 2. Test với MoMo thật (Production)

```bash
# 1. Tạo payment
curl -X POST http://localhost:5000/api/topup/create-momo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}'

# 2. Mở payUrl trong browser và thanh toán

# 3. MoMo sẽ gọi callback tự động
# Check logs: docker-compose logs -f server | grep "MOMO CALLBACK"

# 4. Check status
curl http://localhost:5000/api/topup/status/$TOPUP_ID
```

### 3. Manual mark success (Emergency)

```bash
# Nếu callback fail, có thể mark success thủ công
curl -X PUT http://localhost:5000/api/topup/mark-success/$TOPUP_ID
```

---

## Debug Checklist

### ✅ Kiểm tra MoMo Callback

```bash
# 1. Check callback endpoint accessible
curl http://localhost:5000/api/topup/callback

# 2. Check server logs
docker-compose logs -f server | grep "MOMO CALLBACK"

# 3. Check MoMo IPN URL trong .env
echo $MOMO_TOPUP_IPN_URL
# Should be: https://your-domain.com/api/topup/callback
```

### ✅ Kiểm tra Database

```bash
# Connect to MongoDB
docker exec -it aistudio_server mongosh "$MONGO_URI"

# Check TopUp records
db.topups.find({status: "success"}).pretty()

# Check Profile balance
db.profiles.find({}).pretty()

# Check if balance matches
db.topups.aggregate([
  {$match: {userId: ObjectId("USER_ID"), status: "success"}},
  {$group: {_id: null, total: {$sum: "$amount"}}}
])
```

### ✅ Kiểm tra Logs

```bash
# Server logs
docker-compose logs -f server

# Filter for topup logs
docker-compose logs server | grep "💰\|✅\|❌"

# Check specific topup
docker-compose logs server | grep "TOPUP_ID"
```

---

## Common Issues & Solutions

### Issue 1: MoMo Callback không được gọi

**Nguyên nhân:**
- Server không accessible từ internet
- IPN URL sai
- Firewall block

**Giải pháp:**
```bash
# 1. Check IPN URL
echo $MOMO_TOPUP_IPN_URL

# 2. Test accessibility
curl https://your-domain.com/api/topup/callback

# 3. Use ngrok for local testing
ngrok http 5000
# Update MOMO_TOPUP_IPN_URL to ngrok URL
```

### Issue 2: Signature verification fail

**Nguyên nhân:**
- Secret key sai
- Signature format không đúng

**Giải pháp:**
```bash
# Temporary bypass (ONLY FOR TESTING)
# Add to .env:
MOMO_BYPASS_SIGNATURE=true

# Check logs for signature debug
docker-compose logs server | grep "Signature"
```

### Issue 3: Profile không tồn tại

**Nguyên nhân:**
- User chưa có Profile record

**Giải pháp:**
- ✅ Đã fix: Code tự động tạo Profile nếu chưa có
- Check logs: `Created new Profile for user`

### Issue 4: Balance không update

**Nguyên nhân:**
- TopUp status không phải "success"
- Profile update bị lỗi

**Giải pháp:**
```bash
# 1. Check TopUp status
curl http://localhost:5000/api/topup/status/$TOPUP_ID

# 2. Manual mark success
curl -X PUT http://localhost:5000/api/topup/mark-success/$TOPUP_ID

# 3. Check Profile in DB
docker exec -it aistudio_server mongosh "$MONGO_URI"
db.profiles.findOne({userId: ObjectId("USER_ID")})
```

---

## Testing Flow

### Development (Local)

```bash
# 1. Start server
docker-compose up -d

# 2. Create topup
curl -X POST http://localhost:5000/api/topup/create-momo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000}'

# Response: {"payUrl": "...", "orderId": "TOPUP_ID"}

# 3. Trigger mock callback
curl http://localhost:5000/api/topup/mock-callback/TOPUP_ID

# 4. Verify balance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/topup/account-summary
```

### Production

```bash
# 1. Create payment
# User clicks "Nạp tiền" → redirects to MoMo

# 2. User completes payment on MoMo

# 3. MoMo calls callback automatically
# Check: docker-compose logs -f server | grep "MOMO CALLBACK"

# 4. User returns to site
# Frontend calls: /api/topup/check-momo-status/:id

# 5. Verify balance updated
# Check: /api/topup/account-summary
```

---

## Monitoring

### Real-time logs

```bash
# All topup activity
docker-compose logs -f server | grep -E "💰|TopUp|Balance|MOMO"

# Only successful payments
docker-compose logs -f server | grep "✅.*Balance updated"

# Only errors
docker-compose logs -f server | grep "❌"
```

### Database queries

```sql
-- Total balance per user
db.profiles.aggregate([
  {$project: {userId: 1, balance: 1}},
  {$sort: {balance: -1}}
])

-- Recent successful topups
db.topups.find({status: "success"}).sort({createdAt: -1}).limit(10)

-- Pending topups (potential issues)
db.topups.find({status: "pending", createdAt: {$lt: new Date(Date.now() - 600000)}})
```

---

## Emergency Procedures

### If callback fails completely

```bash
# 1. Get all pending topups
curl http://localhost:5000/api/topup/debug-all-balances

# 2. Manually mark success for verified payments
curl -X PUT http://localhost:5000/api/topup/mark-success/TOPUP_ID

# 3. Verify balance updated
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/topup/balance
```

### If balance is wrong

```bash
# 1. Check all successful topups
db.topups.find({userId: ObjectId("USER_ID"), status: "success"})

# 2. Calculate expected balance
db.topups.aggregate([
  {$match: {userId: ObjectId("USER_ID"), status: "success"}},
  {$group: {_id: null, total: {$sum: "$amount"}}}
])

# 3. Update Profile manually if needed
db.profiles.updateOne(
  {userId: ObjectId("USER_ID")},
  {$set: {balance: CORRECT_AMOUNT}}
)
```

---

## Contact Support

Nếu vẫn gặp vấn đề sau khi thử các bước trên:

1. Collect logs: `docker-compose logs server > server.log`
2. Export database: `mongodump --uri="$MONGO_URI"`
3. Note the topup ID and timestamp
4. Contact dev team với thông tin trên

---

## Changes Made

### File: `AIStudio/Server/controllers/topupController.js`

1. ✅ Added `addBalanceToProfile()` helper function
2. ✅ Added duplicate check in all payment processing functions
3. ✅ Added auto-create Profile if not exists
4. ✅ Added 10-second delay in `checkPaymentStatusFromMomo`
5. ✅ Enhanced logging for debugging
6. ✅ Fixed race condition between callback and status check

### Testing

```bash
# Run full test
./scripts/test-topup.sh TOPUP_ID

# Or manual test
curl http://localhost:5000/api/topup/mock-callback/TOPUP_ID
```
