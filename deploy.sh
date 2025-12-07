#!/bin/bash

# AIStudio Production Deployment Script
# Tự động deploy ứng dụng lên server với Docker

set -e  # Exit on error

echo "🚀 Bắt đầu deploy AIStudio..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}⚠️  Cảnh báo: Đang chạy với quyền root${NC}"
fi

# 1. Kiểm tra Docker
echo "📦 Kiểm tra Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker chưa được cài đặt!${NC}"
    echo "Vui lòng cài đặt Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose chưa được cài đặt!${NC}"
    echo "Vui lòng cài đặt Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker đã sẵn sàng${NC}"
echo ""

# 2. Kiểm tra file .env
echo "⚙️  Kiểm tra cấu hình..."
if [ ! -f "Server/.env" ]; then
    echo -e "${RED}❌ File Server/.env không tồn tại!${NC}"
    echo "Vui lòng tạo file .env từ .env.example"
    exit 1
fi

# Kiểm tra các biến môi trường quan trọng
required_vars=("MONGO_URI" "JWT_SECRET" "CLOUDINARY_CLOUD_NAME")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" Server/.env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Thiếu các biến môi trường: ${missing_vars[*]}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Cấu hình hợp lệ${NC}"
echo ""

# 3. Backup (nếu có container đang chạy)
echo "💾 Backup dữ liệu..."
if docker ps -a | grep -q aistudio_server; then
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="backups/${timestamp}"
    mkdir -p "$backup_dir"
    
    # Backup outputs
    if docker volume ls | grep -q aistudio_outputs; then
        echo "Đang backup outputs..."
        docker run --rm -v aistudio_outputs:/data -v "$(pwd)/${backup_dir}:/backup" alpine tar czf /backup/outputs.tar.gz /data
        echo -e "${GREEN}✓ Đã backup outputs${NC}"
    fi
    
    echo -e "${GREEN}✓ Backup hoàn tất tại ${backup_dir}${NC}"
else
    echo "Không có dữ liệu cần backup"
fi
echo ""

# 4. Stop containers cũ
echo "⏹️  Dừng containers cũ..."
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Đã dừng containers cũ${NC}"
echo ""

# 5. Pull latest code (nếu là git repo)
if [ -d ".git" ]; then
    echo "📥 Cập nhật code..."
    git pull origin main || git pull origin master || echo "Không thể pull code"
    echo ""
fi

# 6. Build và start containers
echo "🔨 Build Docker images..."
docker-compose build --no-cache

echo ""
echo "▶️  Khởi động containers..."
docker-compose up -d

echo ""
echo "⏳ Đợi services khởi động..."
sleep 10

# 7. Kiểm tra health
echo ""
echo "🏥 Kiểm tra health..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server đã sẵn sàng!${NC}"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Server không phản hồi sau 60 giây${NC}"
    echo "Kiểm tra logs: docker-compose logs server"
    exit 1
fi

echo ""

# 8. Verify deployment
echo "🔍 Xác minh deployment..."
echo ""

# Check containers
echo "📊 Container status:"
docker-compose ps
echo ""

# Check logs
echo "📋 Server logs (10 dòng cuối):"
docker-compose logs --tail=10 server
echo ""

# Test endpoints
echo "🧪 Test endpoints:"
endpoints=(
    "http://localhost:5000/api/health"
    "http://localhost:5000/api/prompts"
    "http://localhost/index.html"
)

for endpoint in "${endpoints[@]}"; do
    if curl -sf "$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $endpoint"
    else
        echo -e "${RED}✗${NC} $endpoint"
    fi
done

echo ""
echo "================================"
echo -e "${GREEN}✅ Deploy hoàn tất!${NC}"
echo ""
echo "📍 Truy cập ứng dụng:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:5000"
echo "   API Docs: http://localhost:5000/api-docs"
echo ""
echo "📊 Quản lý:"
echo "   Xem logs:     docker-compose logs -f"
echo "   Restart:      docker-compose restart"
echo "   Stop:         docker-compose down"
echo "   Status:       docker-compose ps"
echo ""
echo "🔧 Troubleshooting:"
echo "   Nếu có lỗi, chạy: docker-compose logs -f"
echo "   Verify:           ./scripts/verify-production.sh"
echo ""
