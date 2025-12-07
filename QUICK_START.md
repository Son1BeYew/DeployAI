# 🚀 Quick Start Guide - AIStudio

## Restart Server (Sau khi fix code)

### Cách 1: Double-click file .bat (Windows - Dễ nhất) ⭐
```
1. Mở Docker Desktop
2. Double-click: restart-server.bat
3. Đợi server restart
4. Done!
```

### Cách 2: Command Line
```bash
# Mở Docker Desktop trước

# Restart server
docker-compose restart server

# Check logs
docker-compose logs -f server
```

### Cách 3: Rebuild (nếu thay đổi code nhiều)
```
Double-click: rebuild-server.bat
```

---

## Check Server Status

### Quick Check
```
Double-click: check-server.bat
```

### Manual Check
```bash
# Check containers
docker-compose ps

# Check health
curl http://localhost:5000/api/health

# Check logs
docker-compose logs --tail=50 server
```

---

## Test Topup Payment

### Option 1: Debug UI (Khuyến nghị) ⭐
```
1. Mở: http://localhost/debug-topup.html
2. Click "Load from localStorage"
3. Test các chức năng
```

### Option 2: cURL
```bash
# Get balance
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/topup/balance

# Fix balance
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/topup/fix-balance

# Mock callback (test)
curl http://localhost:5000/api/topup/mock-callback/TOPUP_ID
```

---

## Common Issues

### ❌ Docker Desktop không chạy
```
✅ Giải pháp:
1. Mở Docker Desktop
2. Đợi icon màu xanh
3. Chạy lại script
```

### ❌ Server không restart
```
✅ Giải pháp:
Double-click: rebuild-server.bat
```

### ❌ Balance không đúng
```
✅ Giải pháp:
1. Mở: http://localhost/debug-topup.html
2. Click "Fix Balance"
```

### ❌ Code thay đổi nhưng không apply
```
✅ Giải pháp:
Double-click: rebuild-server.bat
```

---

## Files Overview

### Scripts (Windows)
- `restart-server.bat` - Restart server nhanh
- `rebuild-server.bat` - Rebuild khi thay đổi code
- `check-server.bat` - Check status

### Debug Tools
- `debug-topup.html` - UI tool để test topup
- `TOPUP_DEBUG_GUIDE.md` - Hướng dẫn debug chi tiết
- `TOPUP_FIX_SUMMARY.md` - Tóm tắt fix

### Deployment
- `deploy.sh` - Deploy production
- `docker-compose.yml` - Docker config

---

## Development Workflow

### 1. Thay đổi code
```
Edit file trong Server/controllers/ hoặc Server/routes/
```

### 2. Restart server
```
Double-click: restart-server.bat
```

### 3. Test changes
```
Mở: http://localhost/debug-topup.html
```

### 4. Check logs
```
docker-compose logs -f server
```

---

## Useful URLs

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs
- **Debug Tool**: http://localhost/debug-topup.html
- **Health Check**: http://localhost:5000/api/health

---

## Quick Commands

```bash
# Start all
docker-compose up -d

# Stop all
docker-compose down

# Restart server only
docker-compose restart server

# View logs
docker-compose logs -f server

# Check status
docker-compose ps

# Rebuild
docker-compose up -d --build server
```

---

## Next Steps

1. ✅ Restart server: `restart-server.bat`
2. ✅ Test topup: http://localhost/debug-topup.html
3. ✅ Check logs: `docker-compose logs -f server`
4. ✅ Deploy: `./deploy.sh`

---

**Need Help?**
- Debug Guide: `TOPUP_DEBUG_GUIDE.md`
- Restart Guide: `RESTART_GUIDE.md`
- Fix Summary: `TOPUP_FIX_SUMMARY.md`
