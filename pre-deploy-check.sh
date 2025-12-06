#!/bin/bash

# Pre-deployment Check Script
# Kiểm tra mọi thứ trước khi deploy

echo "🔍 Kiểm tra trước khi deploy..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# 1. Kiểm tra Docker
echo "📦 Docker & Docker Compose"
if command -v docker &> /dev/null; then
    check_pass "Docker đã cài đặt ($(docker --version))"
else
    check_fail "Docker chưa được cài đặt"
fi

if command -v docker-compose &> /dev/null; then
    check_pass "Docker Compose đã cài đặt ($(docker-compose --version))"
else
    check_fail "Docker Compose chưa được cài đặt"
fi
echo ""

# 2. Kiểm tra files cần thiết
echo "📁 Files cần thiết"
required_files=(
    "Server/.env"
    "Server/package.json"
    "Server/server.js"
    "Server/Dockerfile"
    "Client/Dockerfile"
    "docker-compose.yml"
    "nginx.conf"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file"
    else
        check_fail "$file không tồn tại"
    fi
done
echo ""

# 3. Kiểm tra .env
echo "⚙️  Biến môi trường (.env)"
if [ -f "Server/.env" ]; then
    required_vars=(
        "MONGO_URI"
        "JWT_SECRET"
        "CLOUDINARY_CLOUD_NAME"
        "CLOUDINARY_API_KEY"
        "CLOUDINARY_API_SECRET"
        "FRONTEND_URL"
        "BACKEND_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" Server/.env && ! grep -q "^${var}=$" Server/.env; then
            check_pass "$var đã được set"
        else
            check_fail "$var chưa được set hoặc rỗng"
        fi
    done
    
    # Check for example values
    if grep -q "your-" Server/.env; then
        check_warn "Có giá trị mẫu (your-*) trong .env, cần thay đổi"
    fi
    
    if grep -q "supersecret" Server/.env; then
        check_warn "JWT_SECRET đang dùng giá trị mặc định, nên thay đổi"
    fi
else
    check_fail "File Server/.env không tồn tại"
fi
echo ""

# 4. Kiểm tra MongoDB connection
echo "🗄️  MongoDB Connection"
if [ -f "Server/.env" ]; then
    MONGO_URI=$(grep "^MONGO_URI=" Server/.env | cut -d '=' -f2-)
    if [ -n "$MONGO_URI" ]; then
        if [[ "$MONGO_URI" == mongodb+srv://* ]] || [[ "$MONGO_URI" == mongodb://* ]]; then
            check_pass "MONGO_URI format hợp lệ"
            
            # Try to test connection if mongosh is available
            if command -v mongosh &> /dev/null; then
                if mongosh "$MONGO_URI" --eval "db.adminCommand('ping')" &> /dev/null; then
                    check_pass "Kết nối MongoDB thành công"
                else
                    check_warn "Không thể kết nối MongoDB (kiểm tra IP whitelist)"
                fi
            else
                check_warn "mongosh chưa cài, không thể test connection"
            fi
        else
            check_fail "MONGO_URI format không hợp lệ"
        fi
    fi
fi
echo ""

# 5. Kiểm tra ports
echo "🔌 Ports"
check_port() {
    local port=$1
    local name=$2
    if netstat -tuln 2>/dev/null | grep -q ":${port} " || ss -tuln 2>/dev/null | grep -q ":${port} "; then
        check_warn "Port $port ($name) đang được sử dụng"
    else
        check_pass "Port $port ($name) available"
    fi
}

check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 5000 "Backend API"
echo ""

# 6. Kiểm tra disk space
echo "💾 Disk Space"
available_space=$(df -h . | awk 'NR==2 {print $4}')
echo "Available: $available_space"
if [ -n "$available_space" ]; then
    check_pass "Disk space: $available_space"
fi
echo ""

# 7. Kiểm tra memory
echo "🧠 Memory"
if command -v free &> /dev/null; then
    total_mem=$(free -h | awk 'NR==2 {print $2}')
    available_mem=$(free -h | awk 'NR==2 {print $7}')
    echo "Total: $total_mem, Available: $available_mem"
    check_pass "Memory: $available_mem available"
fi
echo ""

# 8. Kiểm tra Dockerfile syntax
echo "🐳 Dockerfile Syntax"
if docker build -f Server/Dockerfile -t test-server-build Server --no-cache &> /dev/null; then
    check_pass "Server Dockerfile hợp lệ"
    docker rmi test-server-build &> /dev/null
else
    check_fail "Server Dockerfile có lỗi"
fi

if docker build -f Client/Dockerfile -t test-client-build Client --no-cache &> /dev/null; then
    check_pass "Client Dockerfile hợp lệ"
    docker rmi test-client-build &> /dev/null
else
    check_fail "Client Dockerfile có lỗi"
fi
echo ""

# 9. Kiểm tra nginx.conf syntax
echo "🔧 Nginx Config"
if [ -f "nginx.conf" ]; then
    # Basic syntax check
    if grep -q "server {" nginx.conf && grep -q "location" nginx.conf; then
        check_pass "nginx.conf syntax cơ bản OK"
    else
        check_warn "nginx.conf có thể thiếu cấu hình"
    fi
fi
echo ""

# Summary
echo "================================"
echo "📊 Tổng kết:"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Tất cả kiểm tra đều PASS!${NC}"
    echo "Bạn có thể deploy ngay bây giờ:"
    echo "  ./deploy.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Có $WARNINGS cảnh báo${NC}"
    echo "Bạn có thể deploy nhưng nên xem lại các cảnh báo"
    echo "  ./deploy.sh"
    exit 0
else
    echo -e "${RED}❌ Có $ERRORS lỗi và $WARNINGS cảnh báo${NC}"
    echo "Vui lòng sửa các lỗi trước khi deploy"
    exit 1
fi
