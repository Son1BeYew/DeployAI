#!/bin/bash

# SSL Setup Script for AIStudio
# Tự động cài đặt SSL certificate với Let's Encrypt

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔒 AIStudio SSL Setup${NC}"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Script này cần chạy với quyền root${NC}"
    echo "Chạy lại với: sudo ./setup-ssl.sh"
    exit 1
fi

# Get domain
read -p "Nhập domain của bạn (vd: enternapic.io.vn): " DOMAIN
read -p "Nhập email để nhận thông báo SSL (vd: admin@example.com): " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Domain và email không được để trống${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}Email: $EMAIL${NC}"
echo ""
read -p "Xác nhận thông tin trên? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Đã hủy"
    exit 0
fi

# 1. Install Certbot
echo ""
echo -e "${BLUE}📦 Cài đặt Certbot...${NC}"

if command -v apt-get &> /dev/null; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
elif command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum install -y certbot python3-certbot-nginx
else
    echo -e "${RED}❌ Không hỗ trợ hệ điều hành này${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Đã cài đặt Certbot${NC}"

# 2. Stop containers để certbot có thể bind port 80
echo ""
echo -e "${BLUE}⏹️  Dừng containers tạm thời...${NC}"
cd "$(dirname "$0")"
docker-compose down

# 3. Get SSL certificate
echo ""
echo -e "${BLUE}🔐 Lấy SSL certificate...${NC}"
certbot certonly --standalone \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --preferred-challenges http

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Không thể lấy SSL certificate${NC}"
    echo "Kiểm tra:"
    echo "  1. Domain đã trỏ đúng IP chưa?"
    echo "  2. Port 80 có bị block không?"
    echo "  3. Firewall đã mở port 80/443 chưa?"
    exit 1
fi

echo -e "${GREEN}✓ Đã lấy SSL certificate${NC}"

# 4. Create SSL nginx config
echo ""
echo -e "${BLUE}⚙️  Cấu hình nginx với SSL...${NC}"

cat > nginx-ssl.conf << 'EOF'
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Client root
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy to backend
    location /api/ {
        proxy_pass http://server:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Auth routes proxy
    location /auth/ {
        proxy_pass http://server:5000/auth/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Protected route proxy
    location /protected {
        proxy_pass http://server:5000/protected;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
    }

    # Share routes proxy
    location /share/ {
        proxy_pass http://server:5000/share/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Outputs proxy (generated images)
    location /outputs/ {
        proxy_pass http://server:5000/outputs/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # API docs
    location /api-docs {
        proxy_pass http://server:5000/api-docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files with caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # Admin routes
    location /admin {
        try_files $uri $uri/ /admin/index.html;
    }

    # SPA fallback for client routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Replace domain placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx-ssl.conf

echo -e "${GREEN}✓ Đã tạo nginx-ssl.conf${NC}"

# 5. Backup old config
if [ -f "nginx.conf" ]; then
    cp nginx.conf nginx.conf.backup
    echo -e "${GREEN}✓ Đã backup nginx.conf -> nginx.conf.backup${NC}"
fi

# 6. Update docker-compose.yml
echo ""
echo -e "${BLUE}🐳 Cập nhật docker-compose.yml...${NC}"

cat > docker-compose-ssl.yml << 'EOF'
version: "3.8"

services:
  server:
    build: 
      context: ./Server
      dockerfile: Dockerfile
    container_name: aistudio_server
    ports:
      - "5000:5000"
    env_file:
      - ./Server/.env
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - ./Server/outputs:/app/outputs
      - ./Server/config:/app/config
    restart: always
    networks:
      - aistudio_net
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  client:
    build:
      context: ./Client
      dockerfile: Dockerfile
    container_name: aistudio_client
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server
    restart: always
    networks:
      - aistudio_net
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro

networks:
  aistudio_net:
    driver: bridge
EOF

# Backup old docker-compose
if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml docker-compose.yml.backup
    echo -e "${GREEN}✓ Đã backup docker-compose.yml${NC}"
fi

cp docker-compose-ssl.yml docker-compose.yml
echo -e "${GREEN}✓ Đã cập nhật docker-compose.yml${NC}"

# 7. Start containers with SSL
echo ""
echo -e "${BLUE}🚀 Khởi động containers với SSL...${NC}"
docker-compose up -d --build

echo ""
echo -e "${BLUE}⏳ Đợi services khởi động...${NC}"
sleep 10

# 8. Test SSL
echo ""
echo -e "${BLUE}🧪 Kiểm tra SSL...${NC}"

if curl -sf "https://$DOMAIN/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ SSL hoạt động!${NC}"
else
    echo -e "${YELLOW}⚠️  Không thể test SSL, kiểm tra thủ công${NC}"
fi

# 9. Setup auto-renewal
echo ""
echo -e "${BLUE}🔄 Cài đặt auto-renewal...${NC}"

# Create renewal script
cat > /usr/local/bin/renew-ssl.sh << 'RENEWAL_EOF'
#!/bin/bash
certbot renew --quiet
docker-compose -f /path/to/AIStudio/docker-compose.yml restart client
RENEWAL_EOF

# Update path
sed -i "s|/path/to/AIStudio|$(pwd)|g" /usr/local/bin/renew-ssl.sh
chmod +x /usr/local/bin/renew-ssl.sh

# Add to crontab (run twice daily)
(crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/local/bin/renew-ssl.sh") | crontab -

echo -e "${GREEN}✓ Đã cài đặt auto-renewal (chạy 2 lần/ngày)${NC}"

# 10. Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ SSL đã được cài đặt thành công!${NC}"
echo ""
echo -e "${BLUE}📍 Thông tin:${NC}"
echo "   Domain:     https://$DOMAIN"
echo "   Certificate: /etc/letsencrypt/live/$DOMAIN/"
echo "   Expires:    $(date -d "+90 days" +%Y-%m-%d)"
echo ""
echo -e "${BLUE}🔧 Quản lý:${NC}"
echo "   Xem logs:        docker-compose logs -f client"
echo "   Restart:         docker-compose restart client"
echo "   Renew manual:    certbot renew"
echo "   Check cert:      certbot certificates"
echo ""
echo -e "${BLUE}🧪 Test SSL:${NC}"
echo "   curl https://$DOMAIN/api/health"
echo "   https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo -e "${YELLOW}⚠️  Lưu ý:${NC}"
echo "   - Certificate sẽ tự động renew mỗi 90 ngày"
echo "   - Backup files: nginx.conf.backup, docker-compose.yml.backup"
echo "   - Nếu có lỗi, restore bằng: cp *.backup và docker-compose restart"
echo " 
