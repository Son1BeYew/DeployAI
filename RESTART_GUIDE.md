# 🔄 Hướng dẫn Restart Server

## Cách 1: Restart với Docker (Khuyến nghị)

### Bước 1: Khởi động Docker Desktop
```
1. Mở Docker Desktop
2. Đợi Docker khởi động hoàn tất (icon màu xanh)
```

### Bước 2: Restart Server Container
```bash
cd AIStudio

# Restart chỉ server (nhanh nhất)
docker-compose restart server

# Hoặc restart tất cả
docker-compose restart

# Hoặc rebuild nếu có thay đổi code
docker-compose up -d --build server
```

### Bước 3: Kiểm tra logs
```bash
# Xem logs real-time
docker-compose logs -f server

# Xem 50 dòng cuối
docker-compose logs --tail=50 server

# Check health
curl http://localhost:5000/api/health
```

---

## Cách 2: Stop & Start (Nếu restart không work)

```bash
cd AIStudio

# Stop server
docker-compose stop server

# Start lại
docker-compose start server

# Hoặc down & up (clean restart)
docker-compose down
docker-compose up -d
```

---

## Cách 3: Rebuild (Nếu có thay đổi code)

```bash
cd AIStudio

# Rebuild server image
docker-compose build --no-cache server

# Start với image mới
docker-compose up -d server

# Hoặc rebuild tất cả
docker-compose up -d --build
```

---

## Cách 4: Chạy trực tiếp (Không dùng Docker)

### Nếu muốn test nhanh không qua Docker:

```bash
cd AIStudio/Server

# Install dependencies (lần đầu)
npm install

# Start server
npm start

# Hoặc với nodemon (auto-restart)
npm install -g nodemon
nodemon server.js
```

---

## Troubleshooting

### Lỗi: Docker Desktop không chạy
```
✅ Giải pháp:
1. Mở Docker Desktop
2. Đợi icon Docker màu xanh
3. Chạy lại lệnh restart
```

### Lỗi: Port 5000 đã được sử dụng
```bash
# Tìm process đang dùng port 5000
netstat -ano | findstr :5000

# Kill process (thay PID)
taskkill /PID <PID> /F

# Hoặc đổi port trong .env
PORT=5001
```

### Lỗi: Container không start
```bash
# Check logs để xem lỗi
docker-compose logs server

# Remove container và tạo lại
docker-compose down
docker-compose up -d
```

### Lỗi: Code thay đổi nhưng không apply
```bash
# Rebuild image
docker-compose build --no-cache server
docker-compose up -d server

# Verify code đã update
docker exec aistudio_server cat /app/controllers/topupController.js | grep "addBalanceToProfile"
```

---

## Quick Commands

```bash
# Restart nhanh
docker-compose restart server

# Rebuild & restart
docker-compose up -d --build server

# Check status
docker-compose ps

# View logs
docker-compose logs -f server

# Check health
curl http://localhost:5000/api/health

# Enter container
docker exec -it aistudio_server sh

# Check running processes
docker-compose ps
```

---

## Verify Server is Running

### 1. Check Docker
```bash
docker-compose ps
# Should show: aistudio_server   Up
```

### 2. Check Health Endpoint
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok",...}
```

### 3. Check Logs
```bash
docker-compose logs --tail=20 server
# Should show: "Server running on http://localhost:5000"
```

### 4. Test Topup Endpoint
```bash
curl http://localhost:5000/api/topup/callback
# Should return: {"message":"Callback endpoint is accessible",...}
```

---

## After Restart Checklist

- [ ] Docker Desktop đang chạy
- [ ] Container status = "Up"
- [ ] Health endpoint trả về OK
- [ ] Logs không có error
- [ ] Test endpoint hoạt động
- [ ] Frontend connect được backend

---

## Development Workflow

### Khi thay đổi code:

```bash
# 1. Save file
# 2. Restart server
docker-compose restart server

# 3. Check logs
docker-compose logs -f server

# 4. Test changes
curl http://localhost:5000/api/topup/balance \
  -H "Authorization: Bearer $TOKEN"
```

### Khi thay đổi dependencies (package.json):

```bash
# 1. Rebuild image
docker-compose build --no-cache server

# 2. Start với image mới
docker-compose up -d server

# 3. Verify
docker-compose logs -f server
```

---

## Production Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images
docker-compose build --no-cache

# 3. Stop old containers
docker-compose down

# 4. Start new containers
docker-compose up -d

# 5. Verify
./scripts/verify-production.sh

# 6. Monitor logs
docker-compose logs -f
```

---

## Useful Aliases (Optional)

Thêm vào `.bashrc` hoặc `.zshrc`:

```bash
# Docker compose shortcuts
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dcrestart='docker-compose restart'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'

# AIStudio specific
alias ai-restart='cd ~/AIStudio && docker-compose restart server'
alias ai-logs='cd ~/AIStudio && docker-compose logs -f server'
alias ai-health='curl http://localhost:5000/api/health'
```

---

## Emergency Procedures

### Server không response:

```bash
# 1. Check if running
docker-compose ps

# 2. Check logs
docker-compose logs --tail=100 server

# 3. Restart
docker-compose restart server

# 4. If still not working, rebuild
docker-compose down
docker-compose up -d --build
```

### Database connection issues:

```bash
# 1. Check MongoDB URI in .env
cat Server/.env | grep MONGO_URI

# 2. Test connection
docker exec aistudio_server node -e "
  require('mongoose').connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected'))
    .catch(err => console.log('❌ Error:', err.message))
"

# 3. Restart server
docker-compose restart server
```

### Out of memory:

```bash
# 1. Check memory usage
docker stats --no-stream

# 2. Restart containers
docker-compose restart

# 3. Clean up
docker system prune -a
```

---

**Last Updated**: 2024-12-07
