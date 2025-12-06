# Quick Deploy - Hướng dẫn nhanh

## Bước 1: Chuẩn bị (5 phút)

### Trên máy local của bạn:

```bash
# 1. Kiểm tra file .env
cd AIStudio/Server
cat .env

# 2. Đảm bảo các biến quan trọng đã được set:
# - MONGO_URI
# - JWT_SECRET
# - CLOUDINARY_*
# - REPLICATE_API_TOKEN
# - GEMINI_API_KEY
```

## Bước 2: Upload lên Server

### Option A: Sử dụng Git (Khuyến nghị)

```bash
# Trên server
cd /var/www
git clone <your-repo-url> AIStudio
cd AIStudio

# Copy file .env từ máy local lên server
# Sử dụng scp hoặc copy thủ công
```

### Option B: Upload trực tiếp

```bash
# Trên máy local
scp -r AIStudio user@your-server-ip:/var/www/
```

## Bước 3: Cài đặt Docker (nếu chưa có)

```bash
# Trên server
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

## Bước 4: Deploy (2 phút)

```bash
# Trên server
cd /var/www/AIStudio

# Chạy script deploy
chmod +x deploy.sh
./deploy.sh
```

Script sẽ tự động:
- ✅ Kiểm tra Docker
- ✅ Kiểm tra .env
- ✅ Backup dữ liệu cũ (nếu có)
- ✅ Build Docker images
- ✅ Start containers
- ✅ Verify deployment

## Bước 5: Kiểm tra

```bash
# Xem status
docker-compose ps

# Test API
curl http://localhost:5000/api/health

# Xem logs
docker-compose logs -f
```

## Bước 6: Cấu hình Domain (Optional)

### 6.1. Trỏ DNS

Trỏ domain về IP server:
- A Record: `yourdomain.com` → `your-server-ip`

### 6.2. Cài SSL

```bash
# Cài Certbot
sudo apt-get install -y certbot

# Lấy certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates sẽ ở: /etc/letsencrypt/live/yourdomain.com/
```

### 6.3. Cập nhật nginx.conf

Thêm SSL vào `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of config
}
```

### 6.4. Mount SSL vào container

Cập nhật `docker-compose.yml`:

```yaml
services:
  client:
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "80:80"
      - "443:443"
```

Restart:
```bash
docker-compose restart client
```

## Troubleshooting

### Lỗi: Port 80 đã được sử dụng

```bash
# Tìm process đang dùng port 80
sudo netstat -tulpn | grep :80

# Kill process
sudo kill -9 <PID>

# Hoặc dùng port khác
# Sửa docker-compose.yml: "8080:80"
```

### Lỗi: Cannot connect to MongoDB

```bash
# Test connection
mongosh "your-mongo-uri"

# Nếu dùng MongoDB Atlas:
# - Kiểm tra IP whitelist (thêm 0.0.0.0/0)
# - Kiểm tra username/password
```

### Lỗi: Docker build failed

```bash
# Clean up
docker system prune -a

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Xem logs chi tiết

```bash
# All logs
docker-compose logs -f

# Server only
docker-compose logs -f server

# Last 100 lines
docker-compose logs --tail=100 server
```

## Commands hữu ích

```bash
# Restart
docker-compose restart

# Stop
docker-compose down

# Update code và redeploy
git pull
./deploy.sh

# Backup
docker run --rm -v aistudio_outputs:/data -v $(pwd)/backups:/backup alpine tar czf /backup/outputs.tar.gz /data

# Monitor resources
docker stats
```

## Checklist Deploy thành công

- [ ] Docker và Docker Compose đã cài
- [ ] File .env đã cấu hình đúng
- [ ] `docker-compose ps` hiển thị 2 containers running
- [ ] `curl http://localhost:5000/api/health` trả về `{"status":"ok"}`
- [ ] Truy cập `http://your-server-ip` thấy trang web
- [ ] API docs tại `http://your-server-ip:5000/api-docs`

## Kết quả mong đợi

Sau khi deploy thành công:

```bash
$ docker-compose ps
NAME                IMAGE               STATUS
aistudio_server     aistudio_server     Up (healthy)
aistudio_client     aistudio_client     Up

$ curl http://localhost:5000/api/health
{"status":"ok","timestamp":"2024-12-06T...","uptime":123.45}
```

Truy cập:
- Frontend: `http://your-server-ip`
- Backend: `http://your-server-ip:5000`
- API Docs: `http://your-server-ip:5000/api-docs`

## Hỗ trợ

Nếu gặp vấn đề:
1. Chạy: `./scripts/verify-production.sh`
2. Xem logs: `docker-compose logs -f`
3. Đọc: `DEPLOY-GUIDE.md` (hướng dẫn chi tiết)

Chúc bạn deploy thành công! 🚀
