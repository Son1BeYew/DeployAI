@echo off
REM Quick restart script for AIStudio Server
REM Usage: Double-click this file or run from command prompt

echo.
echo ========================================
echo   AIStudio Server Restart Script
echo ========================================
echo.

REM Check if Docker Desktop is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not running!
    echo.
    echo Please start Docker Desktop first:
    echo   1. Open Docker Desktop
    echo   2. Wait for it to start (green icon)
    echo   3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Navigate to AIStudio directory
cd /d "%~dp0"

echo [INFO] Current directory: %CD%
echo.

REM Restart server container
echo [INFO] Restarting server container...
docker-compose restart server

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to restart server!
    echo.
    echo Trying alternative method...
    echo.
    
    REM Try stop and start
    echo [INFO] Stopping server...
    docker-compose stop server
    
    echo [INFO] Starting server...
    docker-compose start server
    
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Still failed. Try full rebuild:
        echo   docker-compose down
        echo   docker-compose up -d --build
        echo.
        pause
        exit /b 1
    )
)

echo.
echo [SUCCESS] Server restarted!
echo.

REM Wait a bit for server to start
echo [INFO] Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Check health
echo [INFO] Checking server health...
curl -s http://localhost:5000/api/health >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Server is healthy!
    echo.
    echo Server is running at: http://localhost:5000
    echo API Docs: http://localhost:5000/api-docs
    echo Debug Tool: http://localhost/debug-topup.html
) else (
    echo [WARNING] Server may not be ready yet
    echo Check logs: docker-compose logs -f server
)

echo.
echo ========================================
echo   Restart Complete!
echo ========================================
echo.
echo Press any key to view logs (Ctrl+C to exit)...
pause >nul

REM Show logs
docker-compose logs -f server
