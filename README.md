# AIStudio - AI Image Generation Platform

Nền tảng tạo ảnh AI với các tính năng:
- Tạo ảnh từ prompt với AI
- Thay đổi trang phục và kiểu tóc
- Thay đổi background
- Quản lý premium subscription
- Chatbot hỗ trợ
- Admin dashboard

## Công nghệ sử dụng

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Passport (Google OAuth)
- Cloudinary (Image storage)
- Replicate AI, Stability AI, Gemini AI
- MoMo Payment Gateway
- Swagger API Documentation

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5
- Chart.js
- Font Awesome

### DevOps
- Docker & Docker Compose
- Nginx
- PM2 (optional)

## Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd AIStudio
```

### 2. Cấu hình môi trường
```bash
# Copy file .env mẫu
cp .env.example Server/.env

# Chỉnh sửa file .env với thông tin của bạn
nano Server/.env
```

### 3. Cài đặt dependencies (Development)
```bash
cd Server
npm install
cd ..
```

### 4. Chạy với Docker (Production)
```bash
# Build và start containers
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Hoặc sử dụng script deploy
chmod +x deploy.sh
./deploy.sh
```

### 5. Chạy local (Development)
```bash
# Terminal 1 - Backend
cd Server
npm run dev

# Terminal 2 - Frontend (sử dụng live-server hoặc http-server)
cd Client
npx http-server -p 8080
```

## Cấu trúc dự án

```
AIStudio/
├── Client/                 # Frontend files
│   ├── admin/             # Admin dashboard
│   ├── assets/            # CSS, JS, images
│   │   ├── css/
│   │   ├── js/
│   │   └── components/
│   ├── *.html             # HTML pages
│   └── Dockerfile
├── Server/                # Backend API
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── outputs/          # Generated images
│   ├── server.js         # Entry point
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml    # Docker compose config
├── nginx.conf           # Nginx configuration
├── deploy.sh            # Deployment script
├── .env.example         # Environment variables template
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập
- `GET /auth/google` - Đăng nhập Google
- `POST /auth/refresh-token` - Refresh token

### AI Generation
- `POST /api/ai/generate` - Tạo ảnh từ prompt
- `POST /api/ai/generate-outfit` - Thay đổi trang phục
- `POST /api/ai/generate-background` - Thay đổi background
- `GET /api/ai/daily-quota` - Kiểm tra quota

### User Management
- `GET /api/profile` - Lấy thông tin profile
- `PUT /api/profile` - Cập nhật profile
- `GET /api/history` - Lịch sử tạo ảnh

### Premium
- `GET /api/premium/plans` - Danh sách gói premium
- `POST /api/premium/purchase` - Mua gói premium
- `GET /api/premium/current` - Gói premium hiện tại
- `POST /api/premium/cancel` - Hủy premium

### Admin
- `GET /api/admin/dashboard-stats` - Thống kê dashboard
- `GET /api/admin/users` - Danh sách users
- `GET /api/admin/top-prompts` - Top prompts
- `GET /api/admin/wallet-stats` - Thống kê ví

### Prompts
- `GET /api/prompts` - Danh sách prompts
- `GET /api/prompts/:id` - Chi tiết prompt
- `POST /api/prompts` - Tạo prompt mới (admin)
- `PUT /api/prompts/:id` - Cập nhật prompt (admin)

### Other
- `GET /api/announcements` - Thông báo
- `GET /api/outfit-styles` - Danh sách outfit styles
- `POST /api/chat` - Chatbot
- `GET /api/trends/stats` - Thống kê trends
- `GET /api/health` - Health check

## API Documentation

Sau khi chạy server, truy cập Swagger UI tại:
- Local: http://localhost:5000/api-docs
- Production: https://yourdomain.com/api-docs

## Deployment

Xem hướng dẫn chi tiết tại [README-DEPLOY.md](./README-DEPLOY.md)

### Quick Deploy với Docker

```bash
# 1. Cấu hình .env
cp .env.example Server/.env
nano Server/.env

# 2. Deploy
docker-compose up -d --build

# 3. Kiểm tra
docker-compose ps
docker-compose logs -f
curl http://localhost:5000/api/health
```

### Deploy với SSL

```bash
# Cài đặt certbot
sudo apt-get install certbot python3-certbot-nginx

# Lấy SSL certificate
sudo certbot --nginx -d yourdomain.com

# Restart nginx
docker-compose restart client
```

## Quản lý

### Xem logs
```bash
docker-compose logs -f
docker-compose logs -f server
docker-compose logs -f client
```

### Restart services
```bash
docker-compose restart
docker-compose restart server
docker-compose restart client
```

### Update code
```bash
git pull origin main
docker-compose up -d --build
```

### Backup
```bash
# Backup outputs
docker run --rm -v aistudio_outputs:/data -v $(pwd):/backup alpine tar czf /backup/outputs-backup.tar.gz /data

# Backup MongoDB (nếu dùng local)
docker exec aistudio_server mongodump --uri="$MONGO_URI" --out=/backup
```

## Environment Variables

Các biến môi trường quan trọng:

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production/development) | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `FRONTEND_URL` | Frontend URL | Yes |
| `BACKEND_URL` | Backend API URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Yes |
| `CLOUDINARY_*` | Cloudinary credentials | Yes |
| `REPLICATE_API_TOKEN` | Replicate AI token | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `MOMO_*` | MoMo payment credentials | Optional |
| `EMAIL_*` | Email service credentials | Optional |

## Troubleshooting

### Port đã được sử dụng
```bash
# Kiểm tra port
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :80

# Kill process
sudo kill -9 <PID>
```

### MongoDB connection failed
- Kiểm tra MONGO_URI trong .env
- Kiểm tra IP whitelist trên MongoDB Atlas
- Kiểm tra network connectivity

### Docker issues
```bash
# Clean up
docker-compose down
docker system prune -a

# Rebuild
docker-compose up -d --build
```

### API không hoạt động
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Kiểm tra logs
docker-compose logs -f server
```

## Development

### Chạy tests
```bash
cd Server
npm test
```

### Seed data
```bash
cd Server
npm run seed:outfits
npm run seed:trends
```

### Code style
- ESLint configuration
- Prettier formatting
- Follow Node.js best practices

## Security

- JWT authentication
- Password hashing với bcrypt
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## Performance

- Image optimization với Cloudinary
- CDN for static assets
- Database indexing
- Caching strategies
- Load balancing ready

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is proprietary and confidential.

## Support

- Email: support@yourdomain.com
- Documentation: https://docs.yourdomain.com
- Issues: https://github.com/yourrepo/issues

## Credits

Developed by [Your Team Name]

## Changelog

### Version 1.0.0 (2024-12-06)
- Initial release
- AI image generation
- User authentication
- Premium subscriptions
- Admin dashboard
- Payment integration
