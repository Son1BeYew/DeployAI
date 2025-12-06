#!/bin/bash

# Development startup script
echo "🚀 Starting AIStudio in development mode..."

# Check if .env exists
if [ ! -f "Server/.env" ]; then
    echo "❌ Error: Server/.env file not found!"
    echo "Please copy .env.example to Server/.env and configure it."
    exit 1
fi

# Start backend
echo "📦 Starting backend server..."
cd Server
npm install
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend server..."
cd ../Client
npx http-server -p 8080 -o &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:8080"
echo "API Docs: http://localhost:5000/api-docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
