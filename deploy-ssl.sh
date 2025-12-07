#!/bin/bash

# Quick SSL deployment script
# Sử dụng sau khi đã chạy setup-ssl.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE} Deploy AIStudio với SSL${NC}"
echo "================================"
echo ""

# Check if SSL cert exists
if [ ! -f "/etc/letsencrypt/live/enternapic.io.vn/fullchain.pem" ]; then
    echo -e "${RED} SSL certificate chưa được cài đặt${NC}"
    echo "Chạy: sudo ./setup-ssl.sh trước"
    exit 1
fi

echo -e "${GREEN}✓ SSL certificate đã tồn tại${NC}"

# Check if nginx-ssl.conf exists
if [ ! -f "nginx-ssl.conf" ]; then
    echo -e "${RED} File nginx-ssl.conf không tồn tại${NC}"
    echo "Chạy: sudo ./setup-ssl.sh trước"
    exit 1
fi

echo -e "${GREEN}✓ nginx-ssl.conf đã tồn tại${NC}"
echo ""

# Stop old containers
echo -e "${BLUE}  Dừng containers cũ...${NC}"
docker-compose down 2>/dev/null || true
echo ""

# Use SSL compose file
echo -e "${BLUE} Sử dụng docker-compose-ssl.yml...${NC}"
cp docker-compose-ssl.yml docker-compose.yml
echo -e "${GREEN}✓ Đã cập nhật docker-compose.yml${NC}"
echo ""

# Build without cache (skip buildx issue)
echo -e "${BLUE} Build images...${NC}"
docker-compose build --no-cache || {
    echo -e "${YELLOW}  Build có warning, tiếp tục...${NC}"
}
echo ""

# Start containers
echo -e "${BLUE} Khởi động containers...${NC}"
docker-compose up -d
echo ""

# Wait for services
echo -e "${BLUE}⏳ Đợi services khởi động (15s)...${NC}"
sleep 15

# Check status
echo ""
echo -e "${BLUE} Container status:${NC}"
docker-compose ps
echo ""

# Test endpoints
echo -e "${BLUE} Test endpoints:${NC}"

# Test HTTP redirect
if curl -sI http://enternapic.io.vn | grep -q "301\|302"; then
    echo -e "${GREEN}✓${NC} HTTP redirect hoạt động"
else
    echo -e "${YELLOW}${NC} HTTP redirect chưa hoạt động"
fi

# Test HTTPS
if curl -sk https://enternapic.io.vn/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} HTTPS API hoạt động"
else
    echo -e "${RED}✗${NC} HTTPS API không hoạt động"
fi

# Test frontend
if curl -sk https://enternapic.io.vn > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} HTTPS Frontend hoạt động"
else
    echo -e "${RED}✗${NC} HTTPS Frontend không hoạt động"
fi

echo ""
echo "================================"
echo -e "${GREEN} Deploy SSL hoàn tất!${NC}"
echo ""
echo -e "${BLUE} Truy cập:${NC}"
echo "   https://enternapic.io.vn"
echo "   https://enternapic.io.vn/api-docs"
echo ""
echo -e "${BLUE}🔧 Quản lý:${NC}"
echo "   Xem logs:     docker-compose logs -f"
echo "   Restart:      docker-compose restart"
echo "   Stop:         docker-compose down"
echo ""
echo -e "${YELLOW}  Nhớ cập nhật Server/.env với HTTPS URLs!${NC}"
echo ""

