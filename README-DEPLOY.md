# 🚀 Deploy AIStudio - Hướng dẫn đầy đủ

## 📖 Tài liệu có sẵn

Tôi đã chuẩn bị đầy đủ tài liệu để giúp bạn deploy thành công:

### 🎯 Bắt đầu từ đây
👉 **[START-HERE.md](./START-HERE.md)** - Đọc file này trước!

### 📚 Hướng dẫn chi tiết
- **[quick-deploy.md](./quick-deploy.md)** - Deploy nhanh trong 10-15 phút
- **[DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md)** - Hướng dẫn đầy đủ từ A-Z
- **[DEPLOY-WINDOWS.md](./DEPLOY-WINDOWS.md)** - Dành riêng cho Windows
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Xử lý 15+ lỗi thường gặp
- **[CHECKLIST.md](./CHECKLIST.md)** - Checklist đầy đủ
- **[SUMMARY.md](./SUMMARY.md)** - Tóm tắt những gì đã chuẩn bị

---

## ⚡ Quick Start (3 bước)

### Linux/Mac:
```bash
# 1. Cập nhật .env
nano Server/.env

# 2. Kiểm tra
./pre-deploy-check.sh

# 3. Deploy!
./deploy.sh
```

### Windows:
```powershell
# 1. Cập nhật .env
notepad Server\.env

# 2. Deploy
docker-compose build --no-cache
docker-compose up -d
```

---

## ✅ Đã sửa các vấn đề

1. ✅ Tạo file `nginx.conf` (đã thiếu)
2. ✅ Sửa `Client/Dockerfile` (lỗi COPY path)
3. ✅ Tạo `.dockerignore` (tối ưu build)
4. ✅ Tạo scripts tự động (deploy.sh, pre-deploy-check.sh, fix-common-issues.sh)
5. ✅ Tạo 8 files hướng dẫn chi tiết

---

## 📋 Cần làm gì tiếp?

### 1. Cập nhật Server/.env (BẮT BUỘC)

Các biến quan trọng cần thay đổi:
```env
MONGO_URI=mongodb+srv://your-username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-random-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
REPLICATE_API_TOKEN=your-token
GEMINI_API_KEY=your-key
```

### 2. Deploy

**Tự động (Linux/Mac):**
```bash
./deploy.sh
```

**Thủ công (Windows hoặc Linux/Mac):**
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 3. Verify

```bash
# Kiểm tra containers
docker-compose ps

# Test API
curl http://localhost:5000/api/health

# Mở browser
http://localhost
http://localhost:5000/api-docs
```

---

## 🎯 Kết quả mong đợi

Sau khi deploy thành công:

```bash
$ docker-compose ps
NAME                STATUS
aistudio_server     Up (healthy)
aistudio_client     Up

$ curl http://localhost:5000/api/health
{"status":"ok","timestamp":"...","uptime":123.45}
```

**Truy cập:**
- Frontend: http://localhost
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

---

## 🆘 Gặp vấn đề?

1. **Đọc:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. **Chạy:** `./scripts/verify-production.sh`
3. **Xem logs:** `docker-compose logs -f`

### Lỗi thường gặp:
- Port đã được sử dụng → TROUBLESHOOTING.md #1
- MongoDB connection failed → TROUBLESHOOTING.md #2
- Docker build failed → TROUBLESHOOTING.md #3
- 502 Bad Gateway → TROUBLESHOOTING.md #4
- CORS errors → TROUBLESHOOTING.md #5

---

## 📞 Cần hỗ trợ?

1. Đọc [START-HERE.md](./START-HERE.md)
2. Chọn hướng dẫn phù hợp
3. Follow từng bước
4. Nếu lỗi, xem [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🎉 Tóm tắt

✅ **Đã chuẩn bị:**
- 8 files hướng dẫn chi tiết
- 3 scripts tự động
- Cấu hình nginx.conf
- Sửa lỗi Dockerfile
- Tạo .dockerignore

✅ **Bạn cần làm:**
1. Cập nhật Server/.env
2. Chạy ./deploy.sh
3. Verify và enjoy!

**Chúc bạn deploy thành công! 🚀**

---

*Xem [SUMMARY.md](./SUMMARY.md) để biết chi tiết những gì đã được chuẩn bị.*
