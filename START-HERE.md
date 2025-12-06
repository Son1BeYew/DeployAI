# 🚀 Bắt đầu Deploy AIStudio

## Chọn hướng dẫn phù hợp với bạn:

### 1. 📖 [quick-deploy.md](./quick-deploy.md) - KHUYẾN NGHỊ
**Dành cho:** Người muốn deploy nhanh (10-15 phút)
- Hướng dẫn từng bước ngắn gọn
- Các lệnh copy-paste
- Troubleshooting cơ bản

### 2. 📚 [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md)
**Dành cho:** Người muốn hiểu chi tiết
- Hướng dẫn đầy đủ
- Giải thích từng bước
- Cấu hình nâng cao (SSL, monitoring, backup)

### 3. 🔧 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**Dành cho:** Khi gặp lỗi
- 15+ lỗi thường gặp và cách sửa
- Commands debug hữu ích
- Giải pháp chi tiết

---

## Deploy siêu nhanh (3 lệnh)

```bash
# 1. Sửa các vấn đề thường gặp
./fix-common-issues.sh

# 2. Kiểm tra trước deploy
./pre-deploy-check.sh

# 3. Deploy!
./deploy.sh
```

**Lưu ý:** Nhớ cập nhật `Server/.env` với thông tin thực trước khi deploy!

---

## Cấu trúc thư mục

```
AIStudio/
├── START-HERE.md              ← Bạn đang ở đây
├── quick-deploy.md            ← Hướng dẫn nhanh
├── DEPLOY-GUIDE.md            ← Hướng dẫn chi tiết
├── TROUBLESHOOTING.md         ← Xử lý lỗi
│
├── deploy.sh                  ← Script deploy tự động
├── pre-deploy-check.sh        ← Kiểm tra trước deploy
├── fix-common-issues.sh       ← Sửa lỗi tự động
│
├── docker-compose.yml         ← Cấu hình Docker
├── nginx.conf                 ← Cấu hình Nginx
│
├── Server/                    ← Backend
│   ├── .env                   ← Biến môi trường (CẦN CẬP NHẬT!)
│   ├── server.js
│   └── ...
│
└── Client/                    ← Frontend
    └── ...
```

---

## Checklist trước khi deploy

- [ ] Docker và Docker Compose đã cài
- [ ] File `Server/.env` đã tạo và cập nhật
- [ ] MongoDB URI đã cấu hình
- [ ] Cloudinary credentials đã có
- [ ] AI API keys đã có (Replicate, Gemini, etc.)
- [ ] Port 80 và 5000 available

---

## Các lệnh hữu ích

```bash
# Kiểm tra status
docker-compose ps

# Xem logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update và redeploy
git pull && ./deploy.sh
```

---

## Cần giúp đỡ?

1. **Lỗi khi deploy?** → Xem [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. **Muốn hiểu rõ hơn?** → Đọc [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md)
3. **Cần deploy nhanh?** → Làm theo [quick-deploy.md](./quick-deploy.md)

---

## Kết quả mong đợi

Sau khi deploy thành công:

✅ Frontend: `http://your-server-ip`  
✅ Backend: `http://your-server-ip:5000`  
✅ API Docs: `http://your-server-ip:5000/api-docs`  
✅ Health: `http://your-server-ip:5000/api/health`

---

**Chúc bạn deploy thành công! 🎉**
