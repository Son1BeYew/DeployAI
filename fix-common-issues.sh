#!/bin/bash

# Script tự động sửa các lỗi thường gặp

echo "🔧 Sửa các vấn đề thường gặp..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Tạo .env nếu chưa có
if [ ! -f "Server/.env" ]; then
    echo "📝 Tạo file .env từ template..."
    cat > Server/.env << 'EOF'
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=5000
JWT_SECRET=$(openssl rand -base64 32)
DOTENV_DISABLE_LOGS=true

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

FRONTEND_URL=http://localhost
BACKEND_URL=http://localhost:5000

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

REPLICATE_API_TOKEN=your-replicate-token
GEMINI_API_KEY=your-gemini-key
STABILITY_API_KEY=your-stability-key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EOF
    echo -e "${GREEN}✓ Đã tạo Server/.env${NC}"
    echo -e "${YELLOW}⚠️  Vui lòng cập nhật các giá trị trong file .env${NC}"
fi

# 2. Tạo thư mục cần thiết
echo ""
echo "📁 Tạo các thư mục cần thiết..."
mkdir -p Server/outputs
mkdir -p Server/config
mkdir -p backups
mkdir -p logs
echo -e "${GREEN}✓ Đã tạo thư mục${NC}"

# 3. Fix permissions
echo ""
echo "🔐 Sửa permissions..."
chmod +x deploy.sh 2>/dev/null
chmod +x pre-deploy-check.sh 2>/dev/null
chmod +x scripts/*.sh 2>/dev/null
echo -e "${GREEN}✓ Đã sửa permissions${NC}"

# 4. Clean Docker nếu có lỗi
echo ""
echo "🧹 Dọn dẹp Docker..."
docker-compose down 2>/dev/null || true
docker system prune -f 2>/dev/null || true
echo -e "${GREEN}✓ Đã dọn dẹp Docker${NC}"

# 5. Kiểm tra và stop các service đang dùng port
echo ""
echo "🔌 Kiểm tra ports..."

check_and_offer_kill() {
    local port=$1
    local name=$2
    
    if netstat -tuln 2>/dev/null | grep -q ":${port} " || ss -tuln 2>/dev/null | grep -q ":${port} "; then
        echo -e "${YELLOW}⚠️  Port $port ($name) đang được sử dụng${NC}"
        
        # Tìm PID
        if command -v lsof &> /dev/null; then
            pid=$(lsof -ti:$port 2>/dev/null)
            if [ -n "$pid" ]; then
                echo "Process ID: $pid"
                read -p "Bạn có muốn kill process này? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    kill -9 $pid 2>/dev/null && echo -e "${GREEN}✓ Đã kill process${NC}"
                fi
            fi
        fi
    else
        echo -e "${GREEN}✓ Port $port ($name) available${NC}"
    fi
}

check_and_offer_kill 80 "HTTP"
check_and_offer_kill 5000 "Backend"

# 6. Tạo .dockerignore nếu chưa có
echo ""
echo "🐳 Tạo .dockerignore..."
if [ ! -f ".dockerignore" ]; then
    cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.DS_Store
*.log
.vscode
.idea
backups
logs
EOF
    echo -e "${GREEN}✓ Đã tạo .dockerignore${NC}"
fi

if [ ! -f "Server/.dockerignore" ]; then
    cat > Server/.dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env.example
.DS_Store
*.log
outputs
backups
EOF
    echo -e "${GREEN}✓ Đã tạo Server/.dockerignore${NC}"
fi

# 7. Kiểm tra MongoDB connection
echo ""
echo "🗄️  Kiểm tra MongoDB..."
if [ -f "Server/.env" ]; then
    MONGO_URI=$(grep "^MONGO_URI=" Server/.env | cut -d '=' -f2-)
    if [[ "$MONGO_URI" == *"username:password"* ]]; then
        echo -e "${YELLOW}⚠️  MONGO_URI chưa được cấu hình${NC}"
        echo "Vui lòng cập nhật MONGO_URI trong Server/.env"
    else
        echo -e "${GREEN}✓ MONGO_URI đã được set${NC}"
    fi
fi

# 8. Generate JWT secret nếu đang dùng default
echo ""
echo "🔑 Kiểm tra JWT_SECRET..."
if [ -f "Server/.env" ]; then
    if grep -q "JWT_SECRET=supersecret" Server/.env; then
        new_secret=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
        sed -i.bak "s/JWT_SECRET=supersecret/JWT_SECRET=$new_secret/" Server/.env
        echo -e "${GREEN}✓ Đã tạo JWT_SECRET mới${NC}"
    else
        echo -e "${GREEN}✓ JWT_SECRET đã được set${NC}"
    fi
fi

# Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Hoàn tất sửa các vấn đề!${NC}"
echo ""
echo "📋 Các bước tiếp theo:"
echo "  1. Cập nhật Server/.env với thông tin thực"
echo "  2. Chạy: ./pre-deploy-check.sh"
echo "  3. Nếu OK, chạy: ./deploy.sh"
echo ""
