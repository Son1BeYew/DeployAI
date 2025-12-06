# Deploy AIStudio trên Windows Server

## Lưu ý quan trọng

Scripts `.sh` (bash) không chạy trực tiếp trên Windows. Bạn có 2 lựa chọn:

### Option 1: Sử dụng WSL (Khuyến nghị)
### Option 2: Deploy thủ công với PowerShell/CMD

---

## Option 1: Deploy với WSL (Windows Subsystem for Linux)

### Bước 1: Cài WSL

```powershell
# Chạy PowerShell as Administrator
wsl --install

# Restart máy
# Sau khi restart, mở Ubuntu từ Start Menu
```

### Bước 2: Cài Docker Desktop

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Cài đặt và enable WSL 2 integration
3. Restart Docker Desktop

### Bước 3: Deploy trong WSL

```bash
# Mở Ubuntu terminal
cd /mnt/c/AIStudioDev/AIStudio

# Chạy scripts
./fix-common-issues.sh
./pre-deploy-check.sh
./deploy.sh
```

---

## Option 2: Deploy thủ công trên Windows

### Bước 1: Cài Docker Desktop

1. Download: https://www.docker.com/products/docker-desktop
2. Cài đặt và khởi động Docker Desktop
3. Verify: `docker --version` và `docker-compose --version`

### Bước 2: Chuẩn bị file .env

```powershell
# Tạo .env từ template
cd AIStudio\Server
copy .env.example .env

# Mở và chỉnh sửa .env
notepad .env
```

Cập nhật các giá trị:
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
# ... các biến khác
```

### Bước 3: Kiểm tra cấu hình

```powershell
cd AIStudio

# Kiểm tra file .env tồn tại
dir Server\.env

# Kiểm tra Docker
docker --version
docker-compose --version

# Kiểm tra ports
netstat -ano | findstr :80
netstat -ano | findstr :5000
```

Nếu port đang được sử dụng:
```powershell
# Tìm PID
netstat -ano | findstr :80

# Kill process (thay <PID> bằng số thực)
taskkill /PID <PID> /F
```

### Bước 4: Build và Deploy

```powershell
cd AIStudio

# Stop containers cũ (nếu có)
docker-compose down

# Build images
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Bước 5: Kiểm tra

```powershell
# Xem status
docker-compose ps

# Test health endpoint
curl http://localhost:5000/api/health

# Hoặc mở browser
start http://localhost
start http://localhost:5000/api-docs
```

---

## Troubleshooting trên Windows

### Lỗi: Docker daemon not running

**Giải pháp:**
1. Mở Docker Desktop
2. Đợi Docker khởi động hoàn toàn
3. Thử lại

### Lỗi: Port already in use

```powershell
# Tìm process đang dùng port 80
netstat -ano | findstr :80

# Kill process
taskkill /PID <PID> /F

# Hoặc dùng port khác
# Sửa docker-compose.yml: "8080:80"
```

### Lỗi: Cannot connect to MongoDB

1. Kiểm tra MONGO_URI trong Server\.env
2. Đảm bảo format đúng: `mongodb+srv://...`
3. Kiểm tra IP whitelist trên MongoDB Atlas
4. Test connection:
   ```powershell
   # Nếu có mongosh
   mongosh "your-mongo-uri"
   ```

### Lỗi: File not found

```powershell
# Kiểm tra đường dẫn
cd C:\AIStudioDev\AIStudio
dir

# Đảm bảo các file cần thiết tồn tại
dir Server\.env
dir docker-compose.yml
dir nginx.conf
```

### Lỗi: Permission denied

```powershell
# Chạy PowerShell as Administrator
# Right-click PowerShell → Run as Administrator
```

---

## Commands hữu ích trên Windows

```powershell
# Xem logs
docker-compose logs -f
docker-compose logs -f server

# Restart
docker-compose restart
docker-compose restart server

# Stop
docker-compose down

# Xem containers
docker-compose ps
docker ps -a

# Vào container
docker exec -it aistudio_server sh

# Clean up
docker system prune -a
docker volume prune

# Xem disk usage
docker system df
```

---

## Deploy lên Windows Server (Production)

### Yêu cầu
- Windows Server 2019+
- Docker Desktop hoặc Docker Engine
- Port 80, 443, 5000 mở
- Domain name (khuyến nghị)

### Bước 1: Cài Docker

```powershell
# Download Docker Desktop for Windows Server
# Hoặc cài Docker Engine

# Verify
docker --version
docker-compose --version
```

### Bước 2: Clone project

```powershell
# Nếu có Git
git clone <your-repo-url> C:\inetpub\AIStudio

# Hoặc upload thủ công qua RDP/FTP
```

### Bước 3: Cấu hình

```powershell
cd C:\inetpub\AIStudio\Server
copy .env.example .env
notepad .env

# Cập nhật:
# - MONGO_URI
# - JWT_SECRET
# - FRONTEND_URL=https://yourdomain.com
# - BACKEND_URL=https://yourdomain.com/api
# - Các API keys
```

### Bước 4: Cấu hình Firewall

```powershell
# Mở ports
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### Bước 5: Deploy

```powershell
cd C:\inetpub\AIStudio

docker-compose build --no-cache
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost:5000/api/health
```

### Bước 6: SSL (Optional)

Sử dụng:
- Let's Encrypt với win-acme: https://www.win-acme.com/
- Cloudflare SSL
- Hoặc certificate từ CA

---

## Auto-start khi Windows khởi động

### Option 1: Docker Desktop

Docker Desktop tự động start containers khi khởi động

### Option 2: Task Scheduler

```powershell
# Tạo script start.ps1
@"
cd C:\inetpub\AIStudio
docker-compose up -d
"@ | Out-File -FilePath C:\inetpub\AIStudio\start.ps1

# Tạo Task Scheduler
# 1. Mở Task Scheduler
# 2. Create Task
# 3. Trigger: At startup
# 4. Action: Start a program
#    Program: powershell.exe
#    Arguments: -File C:\inetpub\AIStudio\start.ps1
```

---

## Monitoring trên Windows

### Xem logs

```powershell
# Real-time logs
docker-compose logs -f

# Save logs to file
docker-compose logs > logs.txt
```

### Performance Monitor

```powershell
# CPU & Memory
docker stats

# Disk usage
docker system df
```

### Event Viewer

Xem Docker events trong Windows Event Viewer

---

## Backup trên Windows

```powershell
# Backup outputs
docker run --rm -v aistudio_outputs:/data -v C:\Backups:/backup alpine tar czf /backup/outputs.tar.gz /data

# Hoặc copy thủ công
docker cp aistudio_server:/app/outputs C:\Backups\outputs

# Backup MongoDB
# Sử dụng MongoDB Atlas backup hoặc mongodump
```

---

## Update code

```powershell
cd C:\inetpub\AIStudio

# Nếu dùng Git
git pull

# Rebuild và restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Checklist Deploy thành công

- [ ] Docker Desktop đã cài và running
- [ ] File Server\.env đã cấu hình
- [ ] `docker-compose ps` hiển thị 2 containers Up
- [ ] `curl http://localhost:5000/api/health` trả về OK
- [ ] Truy cập http://localhost thấy trang web
- [ ] Firewall đã mở ports (nếu production)
- [ ] Domain đã trỏ về server (nếu có)

---

## Hỗ trợ

Nếu gặp vấn đề:
1. Xem logs: `docker-compose logs -f`
2. Kiểm tra Docker Desktop đang chạy
3. Verify .env: `type Server\.env`
4. Test ports: `netstat -ano | findstr :80`
5. Đọc TROUBLESHOOTING.md

---

**Chúc bạn deploy thành công trên Windows! 🚀**
