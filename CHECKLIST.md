# ✅ Checklist Deploy AIStudio

## Trước khi Deploy

### 1. Môi trường
- [ ] Docker đã cài đặt (`docker --version`)
- [ ] Docker Compose đã cài đặt (`docker-compose --version`)
- [ ] Git đã cài đặt (nếu cần)
- [ ] Port 80, 443, 5000 available

### 2. Files cần thiết
- [ ] `Server/.env` đã tạo
- [ ] `docker-compose.yml` tồn tại
- [ ] `nginx.conf` tồn tại
- [ ] `Server/Dockerfile` tồn tại
- [ ] `Client/Dockerfile` tồn tại

### 3. Cấu hình .env
- [ ] `MONGO_URI` đã set (MongoDB connection string)
- [ ] `JWT_SECRET` đã đổi (không dùng "supersecret")
- [ ] `CLOUDINARY_CLOUD_NAME` đã set
- [ ] `CLOUDINARY_API_KEY` đã set
- [ ] `CLOUDINARY_API_SECRET` đã set
- [ ] `REPLICATE_API_TOKEN` đã set
- [ ] `GEMINI_API_KEY` đã set
- [ ] `FRONTEND_URL` đã cập nhật (domain của bạn)
- [ ] `BACKEND_URL` đã cập nhật (domain của bạn)
- [ ] `GOOGLE_CLIENT_ID` đã set (nếu dùng Google OAuth)
- [ ] `GOOGLE_CLIENT_SECRET` đã set (nếu dùng Google OAuth)

### 4. Database
- [ ] MongoDB Atlas account đã tạo
- [ ] Database đã tạo
- [ ] User đã tạo với quyền read/write
- [ ] IP whitelist đã cấu hình (0.0.0.0/0 hoặc IP server)
- [ ] Connection string đã test

### 5. External Services
- [ ] Cloudinary account đã tạo
- [ ] Replicate API key đã có
- [ ] Gemini API key đã có
- [ ] Stability AI key đã có (optional)
- [ ] MoMo credentials đã có (nếu dùng payment)
- [ ] Email SMTP đã cấu hình (nếu dùng email)

---

## Trong quá trình Deploy

### 1. Chạy pre-check
```bash
./pre-deploy-check.sh
```
- [ ] Tất cả checks PASS
- [ ] Không có lỗi critical

### 2. Deploy
```bash
./deploy.sh
```
- [ ] Build thành công
- [ ] Containers start thành công
- [ ] Health check PASS

### 3. Verify
```bash
docker-compose ps
```
- [ ] `aistudio_server` status: Up (healthy)
- [ ] `aistudio_client` status: Up

---

## Sau khi Deploy

### 1. Test Endpoints

#### Backend
```bash
curl http://localhost:5000/api/health
```
- [ ] Trả về `{"status":"ok"}`

```bash
curl http://localhost:5000/api/prompts
```
- [ ] Trả về array prompts

```bash
curl http://localhost:5000/api/premium/plans
```
- [ ] Trả về array plans

#### Frontend
- [ ] `http://localhost` load trang chủ
- [ ] `http://localhost/login.html` load trang login
- [ ] `http://localhost/dashboard.html` load dashboard
- [ ] `http://localhost/admin` load admin (nếu có quyền)

#### API Docs
- [ ] `http://localhost:5000/api-docs` hiển thị Swagger UI

### 2. Test Features

#### Authentication
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập với email/password
- [ ] Đăng nhập với Google (nếu đã config)
- [ ] Logout

#### AI Generation
- [ ] Tạo ảnh từ prompt
- [ ] Ảnh được lưu và hiển thị
- [ ] Quota được trừ đúng
- [ ] History được lưu

#### Premium
- [ ] Xem các gói premium
- [ ] Mua gói premium (test mode)
- [ ] Quota được cập nhật

#### Admin (nếu có)
- [ ] Truy cập admin dashboard
- [ ] Xem thống kê
- [ ] Quản lý users
- [ ] Quản lý prompts

### 3. Logs
```bash
docker-compose logs -f
```
- [ ] Không có error nghiêm trọng
- [ ] Server logs bình thường
- [ ] Client logs bình thường

### 4. Performance
```bash
docker stats
```
- [ ] CPU usage < 80%
- [ ] Memory usage < 80%
- [ ] Không có memory leak

---

## Production Checklist

### 1. Domain & DNS
- [ ] Domain đã mua
- [ ] DNS A record trỏ về server IP
- [ ] Domain đã propagate (test: `nslookup yourdomain.com`)

### 2. SSL/HTTPS
- [ ] SSL certificate đã cài (Let's Encrypt hoặc CA)
- [ ] HTTPS hoạt động
- [ ] HTTP redirect to HTTPS
- [ ] Certificate auto-renewal đã setup

### 3. Security
- [ ] JWT_SECRET là random string mạnh
- [ ] .env không commit vào Git
- [ ] MongoDB IP whitelist chỉ cho phép server IP
- [ ] Firewall đã cấu hình
- [ ] Rate limiting enabled
- [ ] CORS đã cấu hình đúng

### 4. Monitoring
- [ ] Uptime monitoring setup (UptimeRobot, Pingdom)
- [ ] Error tracking setup (Sentry, optional)
- [ ] Log rotation setup
- [ ] Disk space monitoring
- [ ] Backup schedule setup

### 5. Backup
- [ ] Database backup schedule
- [ ] Outputs folder backup
- [ ] .env file backup (secure location)
- [ ] Backup restore tested

### 6. Performance
- [ ] CDN setup (Cloudflare, optional)
- [ ] Image optimization enabled
- [ ] Gzip compression enabled
- [ ] Caching configured
- [ ] Database indexes created

### 7. Documentation
- [ ] API documentation accessible
- [ ] Admin guide written
- [ ] User guide written
- [ ] Troubleshooting guide available

---

## Maintenance Checklist (Định kỳ)

### Hàng ngày
- [ ] Kiểm tra uptime
- [ ] Xem logs có error không
- [ ] Kiểm tra disk space

### Hàng tuần
- [ ] Review error logs
- [ ] Kiểm tra performance metrics
- [ ] Test backup restore
- [ ] Update dependencies (nếu có security patches)

### Hàng tháng
- [ ] Full backup
- [ ] Security audit
- [ ] Performance optimization
- [ ] Update documentation
- [ ] Review và clean old data

---

## Rollback Plan

Nếu deploy lỗi:

### 1. Rollback nhanh
```bash
docker-compose down
# Restore backup
docker-compose up -d
```

### 2. Rollback code
```bash
git log  # Xem commit history
git checkout <previous-commit>
./deploy.sh
```

### 3. Restore database
```bash
mongorestore --uri="$MONGO_URI" ./backups/db-backup
```

---

## Emergency Contacts

- **Server Admin:** [Name] - [Phone] - [Email]
- **Database Admin:** [Name] - [Phone] - [Email]
- **DevOps:** [Name] - [Phone] - [Email]
- **Hosting Support:** [Provider] - [Support URL]

---

## Useful Commands Reference

```bash
# Status
docker-compose ps

# Logs
docker-compose logs -f
docker-compose logs -f server

# Restart
docker-compose restart
docker-compose restart server

# Stop
docker-compose down

# Update
git pull && ./deploy.sh

# Backup
./scripts/backup.sh

# Health check
curl http://localhost:5000/api/health

# Monitor
docker stats

# Clean
docker system prune -a
```

---

## Sign-off

Deploy completed by: ________________  
Date: ________________  
Verified by: ________________  
Date: ________________  

Notes:
_________________________________
_________________________________
_________________________________

---

**Chúc mừng! Bạn đã deploy thành công! 🎉**
