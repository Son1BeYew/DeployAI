#!/bin/bash

# PM2 Deployment Script (Alternative to Docker)
echo "🚀 Deploying AIStudio with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Navigate to project directory
cd "$(dirname "$0")/.."

# Install dependencies
echo "📦 Installing dependencies..."
cd Server
npm install --production
cd ..

# Create logs directory
mkdir -p logs

# Stop existing PM2 processes
echo "⏹️  Stopping existing processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start with PM2
echo "▶️  Starting with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 Useful PM2 commands:"
echo "  pm2 status          - View process status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart all processes"
echo "  pm2 stop all        - Stop all processes"
echo "  pm2 monit           - Monitor processes"
