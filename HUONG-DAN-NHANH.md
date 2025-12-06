# 🚀 HƯỚNG DẪN DEPLOY NHANH - TIẾNG VIỆT

## 📌 Đọc file này nếu bạn muốn deploy ngay!

---

## Bước 1: Chuẩn bị (5 phút)

### A. Kiểm tra Docker đã cài chưa

**Windows:**
```powershell
docker --version
docker-compose --version
```

**Linux/Mac:**
```bash
docker --version
docker-compose --version
```

**Nếu chưa có Docker:**
- Windows: Tải Docker Desktop từ https://www.docker.com/products/docker-desktop
- Linux: `curl -fsSL https://get.docker.com | sh`
- Mac: Tải Docker Desktop

### B. Cập nhật file .env

**Windows:**
```powershell
cd AIStudio\Server
notepad .env
```

**Linux/Mac:**
```bash
cd AIStudio/Server
nano .env
```

**Thay đổi các dòng sau:**
```env
# 1. MongoDB (BẮT BUỘC)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
# Lấy từ MongoDB Atlas: https://cloud.mongodb.com

# 2. JWT Secret (BẮT BUỘC)
JWT_SECRET=thay-doi-thanh-chuoi-ngau-nhien-dai
# Có thể dùng: openssl rand -base64 32

# 3. Cloudinary (BẮT BUỘC - để lưu ảnh)
CLOUDINARY_CLOUD_NAME=ten-cloud-cua-ban
CLOUDINARY_API_KEY=api-key-cua-ban
CLOUDINARY_API_SECRET=api-secret-cua-ban
# Lấy từ: https://cloudinary.com

# 4. AI Services (BẮT BUỘC - để tạo ảnh)
REPLICATE_API_TOKEN=token-cua-ban
# Lấy từ: https://replicate.com

GEMINI_API_KEY=key-cua-ban
# Lấy từ: https://makersuite.google.com/app/apikey

# 5. URLs (Thay đổi khi có domain)
FRONTEND_URL=http://localhost
BACKEND_URL=http://localhost:5000
```

**Lưu file và thoát**

---

## Bước 2: Deploy (2 phút)

### Windows:

```powershell
# Vào thư mục project
cd C:\AIStudioDev\AIStudio

# Build và start
docker-compose build --no-cache
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Linux/Mac:

```bash
# Vào thư mục project
cd /path/to/AIStudio

# Chạy script tự động
chmod +x deploy.sh
./deploy.sh

# Hoặc thủ công
docker-compose build --no-cache
docker-compose up -d
```

**Đợi 1-2 phút để containers khởi động...**

---

## Bước 3: Kiểm tra (1 phút)

### A. Kiểm tra containers

```bash
docker-compose ps
```

**Kết quả mong đợi:**
```
NAME                STATUS
aistudio_server     Up (healthy)
aistudio_client     Up
```

### B. Test API

**Windows:**
```powershell
curl http://localhost:5000/api/health
```

**Linux/Mac:**
```bash
curl http://localhost:5000/api/health
```

**Kết quả mong đợi:**
```json
{"status":"ok","timestamp":"...","uptime":123.45}
```

### C. Mở trình duyệt

Truy cập các địa chỉ sau:
- **Trang chủ:** http://localhost
- **API Docs:** http://localhost:5000/api-docs
- **Admin:** http://localhost/admin

**Nếu thấy trang web → THÀNH CÔNG! 🎉**

---

## ❌ Gặp lỗi? Xem đây!

### Lỗi 1: Port 80 đã được sử dụng

**Windows:**
```powershell
# Tìm process đang dùng port 80
netstat -ano | findstr :80

# Kill process (thay <PID> bằng số thực)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Tìm và kill
sudo lsof -ti:80 | xargs kill -9
```

### Lỗi 2: Cannot connect to MongoDB

**Nguyên nhân:** MONGO_URI sai hoặc IP chưa được whitelist

**Giải pháp:**
1. Vào MongoDB Atlas: https://cloud.mongodb.com
2. Network Access → Add IP Address
3. Thêm `0.0.0.0/0` (cho phép tất cả)
4. Restart: `docker-compose restart server`

### Lỗi 3: Docker daemon not running

**Giải pháp:**
- Windows: Mở Docker Desktop và đợi khởi động
- Linux: `sudo systemctl start docker`
- Mac: Mở Docker Desktop

### Lỗi 4: 502 Bad Gateway

**Giải pháp:**
```bash
# Xem logs
docker-compose logs server

# Restart server
docker-compose restart server

# Nếu vẫn lỗi, rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Lỗi 5: Ảnh không hiển thị

**Nguyên nhân:** Cloudinary chưa cấu hình

**Giải pháp:**
1. Kiểm tra CLOUDINARY_* trong .env
2. Đảm bảo credentials đúng
3. Restart: `docker-compose restart server`

---

## 📋 Commands hữu ích

```bash
# Xem logs
docker-compose logs -f

# Xem logs của server
docker-compose logs -f server

# Restart
docker-compose restart

# Stop
docker-compose down

# Xem status
docker-compose ps

# Vào container
docker exec -it aistudio_server sh

# Clean up
docker system prune -a
```

---

## 🌐 Deploy lên Server thật

### 1. Chuẩn bị Server

- Ubuntu 20.04+ hoặc CentOS 7+
- RAM: Tối thiểu 2GB
- Cài Docker và Docker Compose

### 2. Upload code

```bash
# Trên server
cd /var/www
git clone <your-repo-url> AIStudio
cd AIStudio
```

### 3. Cấu hình

```bash
# Cập nhật .env
nano Server/.env

# Thay đổi URLs
FRONTEND_URL=http://your-server-ip
BACKEND_URL=http://your-server-ip:5000
```

### 4. Mở ports

```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
```

### 5. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

### 6. Cấu hình Domain (Optional)

**A. Trỏ DNS:**
- A Record: `yourdomain.com` → `your-server-ip`

**B. Cài SSL:**
```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

**C. Cập nhật .env:**
```env
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com/api
```

**D. Restart:**
```bash
docker-compose restart
```

---

## ✅ Checklist thành công

- [ ] Docker đã cài và chạy
- [ ] File .env đã cập nhật đầy đủ
- [ ] `docker-compose ps` hiển thị 2 containers Up
- [ ] `curl http://localhost:5000/api/health` trả về OK
- [ ] Mở http://localhost thấy trang web
- [ ] Đăng ký tài khoản thành công
- [ ] Tạo ảnh AI thành công

---

## 📚 Tài liệu khác

Nếu cần thêm thông tin:
- **START-HERE.md** - Tổng quan tất cả tài liệu
- **DEPLOY-GUIDE.md** - Hướng dẫn chi tiết đầy đủ
- **DEPLOY-WINDOWS.md** - Hướng dẫn riêng cho Windows
- **TROUBLESHOOTING.md** - Xử lý 15+ lỗi thường gặp
- **CHECKLIST.md** - Checklist đầy đủ từ A-Z

---

## 🆘 Cần giúp đỡ?

1. Xem logs: `docker-compose logs -f`
2. Đọc TROUBLESHOOTING.md
3. Chạy verify: `./scripts/verify-production.sh`
4. Google lỗi cụ thể

---

## 🎉 Kết luận

**3 bước đơn giản:**
1. ✅ Cập nhật Server/.env
2. ✅ Chạy docker-compose up -d
3. ✅ Mở http://localhost

**Chúc bạn deploy thành công! 🚀**

---

*Nếu gặp vấn đề, đọc TROUBLESHOOTING.md hoặc DEPLOY-GUIDE.md*
