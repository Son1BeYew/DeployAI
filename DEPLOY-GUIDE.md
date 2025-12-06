# Hướng dẫn Deploy AIStudio lên Server

## Yêu cầu hệ thống

### Server Requirements
- Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- RAM: Tối thiểu 2GB (khuyến nghị 4GB+)
- Disk: Tối thiểu 20GB
- CPU: 2 cores+
- Docker 20.10+
- Docker Compose 2.0+

### Domain & Network
- Domain name (khuyến nghị)
- Port 80, 443 mở (HTTP/HTTPS)
- Port 5000 mở (Backend API)

## Bước 1: Chuẩn bị Server

### 1.1. Cài đặt Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 1.2. Cài đặt Git (nếu chưa có)

```bash
sudo apt-get update
sudo apt-get install -y git
```

### 1.3. Clone project

```bash
cd /var/www  # hoặc thư mục bạn muốn
git clone <your-repo-url> AIStudio
cd AIStudio
```

## Bước 2: Cấu hình Environment

### 2.1. Tạo file .env

```bash
cd Server
cp .env.example .env
nano .env  # hoặc vi .env
```

### 2.2. Cấu hình các biến quan trọng

```env
# Production mode
NODE_ENV=production

# Database - MongoDB Atlas hoặc local
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this

# URLs - Thay đổi theo domain của bạn
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com/api

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# Cloudinary (Image storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services
REPLICATE_API_TOKEN=your-replicate-token
GEMINI_API_KEY=your-gemini-key
STABILITY_API_KEY=your-stability-key

# Payment (MoMo)
MOMO_PARTNER_CODE=your-partner-code
MOMO_ACCESS_KEY=your-access-key
MOMO_SECRET_KEY=your-secret-key
MOMO_IPN_URL=https://yourdomain.com/api/premium/momo-callback
MOMO_RETURN_URL=https://yourdomain.com/topup.html

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 2.3. Cấu hình CORS trong docker-compose.yml

Mở file `docker-compose.yml` và thêm domain của bạn vào ALLOWED_ORIGINS:

```yaml
services:
  server:
    environment:
      - ALLOWED_ORIGINS=https://enternapic.io.vn/,http://https://enternapic.io.vn/
```

## Bước 3: Deploy với Docker

### 3.1. Chạy script deploy tự động

```bash
cd /var/www/AIStudio
chmod +x deploy.sh
./deploy.sh
```

### 3.2. Hoặc deploy thủ công

```bash
# Build images
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### 3.3. Kiểm tra deployment

```bash
# Kiểm tra containers
docker-compose ps

# Test health endpoint
curl http://localhost:5000/api/health

# Xem logs
docker-compose logs -f server
docker-compose logs -f client
```

## Bước 4: Cấu hình Domain & SSL

### 4.1. Cấu hình DNS

Trỏ domain của bạn đến IP server:
- A Record: `yourdomain.com` → `your-server-ip`
- A Record: `www.yourdomain.com` → `your-server-ip`

### 4.2. Cài đặt SSL với Let's Encrypt

```bash
# Cài Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Lấy SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot sẽ tự động cấu hình nginx
```

### 4.3. Cập nhật nginx.conf cho SSL

Tạo file `nginx-ssl.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of nginx config (copy from nginx.conf)
}
```

### 4.4. Mount SSL certificates vào container

Cập nhật `docker-compose.yml`:

```yaml
services:
  client:
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

Restart:
```bash
docker-compose restart client
```

## Bước 5: Monitoring & Maintenance

### 5.1. Xem logs

```bash
# All logs
docker-compose logs -f

# Server only
docker-compose logs -f server

# Last 100 lines
docker-compose logs --tail=100 server
```

### 5.2. Restart services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart server
docker-compose restart client
```

### 5.3. Update code

```bash
cd /var/www/AIStudio
git pull origin main
docker-compose up -d --build
```

### 5.4. Backup

```bash
# Backup outputs
docker run --rm -v aistudio_outputs:/data -v $(pwd)/backups:/backup alpine tar czf /backup/outputs-$(date +%Y%m%d).tar.gz /data

# Backup database (MongoDB)
mongodump --uri="$MONGO_URI" --out=./backups/db-$(date +%Y%m%d)
```

### 5.5. Auto-renewal SSL

Certbot tự động renew, nhưng bạn có thể test:

```bash
sudo certbot renew --dry-run
```

## Bước 6: Troubleshooting

### Lỗi: Port already in use

```bash
# Kiểm tra port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :5000

# Kill process
sudo kill -9 <PID>
```

### Lỗi: Cannot connect to MongoDB

- Kiểm tra MONGO_URI trong .env
- Kiểm tra IP whitelist trên MongoDB Atlas (thêm 0.0.0.0/0 cho test)
- Test connection: `mongosh "$MONGO_URI"`

### Lỗi: Docker build failed

```bash
# Clean up
docker system prune -a
docker volume prune

# Rebuild
docker-compose build --no-cache
```

### Lỗi: 502 Bad Gateway

```bash
# Kiểm tra server container
docker-compose logs server

# Restart
docker-compose restart server

# Kiểm tra health
curl http://localhost:5000/api/health
```

### Lỗi: CORS issues

Thêm domain vào ALLOWED_ORIGINS trong Server/.env:

```env
ALLOWED_ORIGINS=https://yourdomain.com,http://yourdomain.com,http://localhost:8080
```

## Bước 7: Performance Optimization

### 7.1. Enable Gzip (đã có trong nginx.conf)

### 7.2. Setup CDN (Cloudflare)

1. Đăng ký Cloudflare
2. Thêm domain
3. Cập nhật nameservers
4. Enable caching và optimization

### 7.3. Database Indexing

```javascript
// Đã có trong models, nhưng có thể verify
db.users.createIndex({ email: 1 })
db.histories.createIndex({ userId: 1, createdAt: -1 })
```

### 7.4. PM2 (Alternative to Docker)

Nếu không dùng Docker:

```bash
npm install -g pm2
cd Server
pm2 start server.js --name aistudio-api
pm2 startup
pm2 save
```

## Bước 8: Security Checklist

- [ ] Đổi JWT_SECRET thành giá trị random mạnh
- [ ] Enable HTTPS/SSL
- [ ] Cấu hình firewall (ufw)
- [ ] Giới hạn MongoDB IP whitelist
- [ ] Enable rate limiting
- [ ] Regular backups
- [ ] Update dependencies định kỳ
- [ ] Monitor logs cho suspicious activity
- [ ] Disable debug mode trong production

## Bước 9: Monitoring Setup (Optional)

### 9.1. Setup PM2 monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
```

### 9.2. Setup Uptime monitoring

Sử dụng services như:
- UptimeRobot
- Pingdom
- StatusCake

### 9.3. Setup Error tracking

- Sentry
- LogRocket
- Rollbar

## Scripts hữu ích

```bash
# Deploy
./deploy.sh

# Verify production
./scripts/verify-production.sh

# Backup
./scripts/backup.sh

# Check health
./scripts/check-health.sh

# Monitor
./scripts/monitor.sh
```

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs: `docker-compose logs -f`
2. Verify config: `./scripts/verify-production.sh`
3. Check health: `curl http://localhost:5000/api/health`
4. Review this guide

## Kết luận

Sau khi hoàn thành các bước trên, ứng dụng của bạn sẽ:
- ✅ Chạy trên production với Docker
- ✅ Có SSL/HTTPS
- ✅ Auto-restart khi crash
- ✅ Có monitoring và logs
- ✅ Có backup strategy
- ✅ Tối ưu performance

Chúc bạn deploy thành công! 🚀
