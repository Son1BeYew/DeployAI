# Troubleshooting Guide - Xử lý lỗi thường gặp

## 1. Lỗi Port đã được sử dụng

### Triệu chứng
```
Error: bind: address already in use
Port 80 is already allocated
```

### Giải pháp

```bash
# Tìm process đang dùng port
sudo netstat -tulpn | grep :80
# hoặc
sudo lsof -i :80

# Kill process
sudo kill -9 <PID>

# Hoặc dùng port khác
# Sửa docker-compose.yml:
ports:
  - "8080:80"  # Thay vì "80:80"
```

## 2. Lỗi MongoDB Connection

### Triệu chứng
```
MongoServerError: bad auth
MongooseServerSelectionError: connect ETIMEDOUT
```

### Giải pháp

#### A. Kiểm tra MONGO_URI
```bash
# Xem MONGO_URI
grep MONGO_URI Server/.env

# Format đúng:
mongodb+srv://username:password@cluster.mongodb.net/database
```

#### B. MongoDB Atlas - IP Whitelist
1. Đăng nhập MongoDB Atlas
2. Network Access → Add IP Address
3. Thêm `0.0.0.0/0` (cho phép tất cả) hoặc IP server của bạn

#### C. Test connection
```bash
# Cài mongosh
npm install -g mongosh

# Test
mongosh "your-mongo-uri"
```

## 3. Lỗi Docker Build Failed

### Triệu chứng
```
ERROR [internal] load metadata for docker.io/library/node:18-alpine
failed to solve with frontend dockerfile.v0
```

### Giải pháp

```bash
# Clean Docker cache
docker system prune -a
docker volume prune

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## 4. Lỗi 502 Bad Gateway

### Triệu chứng
- Nginx trả về 502
- Frontend không kết nối được backend

### Giải pháp

```bash
# Kiểm tra server container
docker-compose ps
docker-compose logs server

# Kiểm tra health
curl http://localhost:5000/api/health

# Restart server
docker-compose restart server

# Nếu vẫn lỗi, kiểm tra nginx.conf
# Đảm bảo proxy_pass đúng:
location /api/ {
    proxy_pass http://server:5000/api/;
}
```

## 5. Lỗi CORS

### Triệu chứng
```
Access to fetch at 'http://...' from origin 'http://...' has been blocked by CORS policy
```

### Giải pháp

#### A. Cập nhật ALLOWED_ORIGINS trong .env
```env
ALLOWED_ORIGINS=https://yourdomain.com,http://yourdomain.com,http://localhost:8080
```

#### B. Hoặc trong docker-compose.yml
```yaml
services:
  server:
    environment:
      - ALLOWED_ORIGINS=https://yourdomain.com,http://yourdomain.com
```

#### C. Restart
```bash
docker-compose restart server
```

## 6. Lỗi File .env không tồn tại

### Triệu chứng
```
Error: Cannot find module 'dotenv'
Environment variables not loaded
```

### Giải pháp

```bash
# Tạo .env từ template
cd Server
cp .env.example .env

# Hoặc chạy script
cd ..
./fix-common-issues.sh
```

## 7. Lỗi Permission Denied

### Triệu chứng
```
bash: ./deploy.sh: Permission denied
```

### Giải pháp

```bash
# Fix permissions
chmod +x deploy.sh
chmod +x pre-deploy-check.sh
chmod +x scripts/*.sh

# Hoặc chạy với bash
bash deploy.sh
```

## 8. Lỗi Out of Memory

### Triệu chứng
```
JavaScript heap out of memory
Container killed (OOMKilled)
```

### Giải pháp

#### A. Tăng memory limit trong docker-compose.yml
```yaml
services:
  server:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

#### B. Tăng Node.js heap size
```yaml
services:
  server:
    environment:
      - NODE_OPTIONS=--max-old-space-size=2048
```

## 9. Lỗi SSL Certificate

### Triệu chứng
```
SSL certificate problem: unable to get local issuer certificate
```

### Giải pháp

```bash
# Renew certificate
sudo certbot renew

# Kiểm tra certificate
sudo certbot certificates

# Nếu expired, lấy mới
sudo certbot certonly --standalone -d yourdomain.com

# Restart nginx
docker-compose restart client
```

## 10. Lỗi Images không load

### Triệu chứng
- Ảnh không hiển thị
- 404 trên /outputs/

### Giải pháp

#### A. Kiểm tra volume
```bash
# Xem volumes
docker volume ls

# Inspect volume
docker volume inspect aistudio_outputs
```

#### B. Kiểm tra permissions
```bash
# Vào container
docker exec -it aistudio_server sh

# Kiểm tra thư mục
ls -la /app/outputs
```

#### C. Tạo lại volume
```bash
docker-compose down
docker volume rm aistudio_outputs
docker-compose up -d
```

## 11. Lỗi API không hoạt động

### Triệu chứng
- API trả về 404
- Routes không work

### Giải pháp

```bash
# Kiểm tra logs
docker-compose logs -f server

# Test từng endpoint
curl http://localhost:5000/api/health
curl http://localhost:5000/api/prompts

# Kiểm tra routes trong server.js
docker exec -it aistudio_server cat server.js | grep "app.use"
```

## 12. Lỗi Database Migration

### Triệu chứng
```
Model not found
Collection doesn't exist
```

### Giải pháp

```bash
# Seed data
docker exec -it aistudio_server npm run seed:outfits
docker exec -it aistudio_server npm run seed:trends

# Hoặc vào container
docker exec -it aistudio_server sh
npm run seed:outfits
```

## 13. Lỗi Cloudinary Upload

### Triệu chứng
```
Cloudinary upload failed
Invalid API credentials
```

### Giải pháp

#### A. Kiểm tra credentials
```bash
# Xem env vars
docker exec -it aistudio_server printenv | grep CLOUDINARY
```

#### B. Test Cloudinary
```javascript
// Test trong container
docker exec -it aistudio_server node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
cloudinary.api.ping().then(console.log).catch(console.error);
"
```

## 14. Lỗi Payment Gateway (MoMo)

### Triệu chứng
```
MoMo signature verification failed
Payment callback error
```

### Giải pháp

#### A. Kiểm tra credentials
```bash
grep MOMO Server/.env
```

#### B. Test mode
```env
# Trong .env, bật bypass cho test
MOMO_BYPASS_SIGNATURE=true
```

#### C. Kiểm tra callback URL
```env
MOMO_IPN_URL=https://yourdomain.com/api/premium/momo-callback
MOMO_RETURN_URL=https://yourdomain.com/topup.html
```

## 15. Lỗi Container không start

### Triệu chứng
```
Container exits immediately
Status: Exited (1)
```

### Giải pháp

```bash
# Xem logs chi tiết
docker-compose logs server

# Xem exit code
docker-compose ps

# Start với logs
docker-compose up server

# Debug trong container
docker run -it --rm aistudio_server sh
```

## Commands hữu ích để debug

```bash
# Xem tất cả logs
docker-compose logs -f

# Xem logs của 1 service
docker-compose logs -f server

# Xem 100 dòng cuối
docker-compose logs --tail=100 server

# Vào container
docker exec -it aistudio_server sh

# Xem environment variables
docker exec -it aistudio_server printenv

# Xem processes
docker exec -it aistudio_server ps aux

# Test network
docker exec -it aistudio_server ping server
docker exec -it aistudio_client ping server

# Xem disk usage
docker system df

# Clean up
docker system prune -a
docker volume prune
```

## Scripts tự động sửa lỗi

```bash
# Sửa các lỗi thường gặp
./fix-common-issues.sh

# Kiểm tra trước deploy
./pre-deploy-check.sh

# Verify sau deploy
./scripts/verify-production.sh
```

## Khi nào cần rebuild?

Rebuild khi:
- Thay đổi Dockerfile
- Thay đổi dependencies (package.json)
- Thay đổi code backend
- Lỗi không rõ nguyên nhân

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Khi nào cần restart?

Restart khi:
- Thay đổi .env
- Thay đổi nginx.conf
- Thay đổi docker-compose.yml

```bash
docker-compose restart
# hoặc
docker-compose restart server
```

## Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề:
1. Chạy: `./scripts/verify-production.sh`
2. Thu thập logs: `docker-compose logs > logs.txt`
3. Mô tả chi tiết lỗi
4. Gửi logs và mô tả

## Tài liệu tham khảo

- Docker: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- MongoDB: https://docs.mongodb.com/
- Nginx: https://nginx.org/en/docs/
