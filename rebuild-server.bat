@echo off
REM Rebuild and restart script for AIStudio Server
REM Use this when you change code and need to rebuild

echo.
echo ========================================
echo   AIStudio Server Rebuild Script
echo ========================================
echo.

REM Check if Docker Desktop is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not running!
    echo.
    echo Please start Docker Desktop first.
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

REM Confirm rebuild
echo [WARNING] This will rebuild the server image.
echo This may take a few minutes.
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [INFO] Stopping server...
docker-compose stop server

echo.
echo [INFO] Rebuilding server image (no cache)...
docker-compose build --no-cache server

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] Starting server with new image...
docker-compose up -d server

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start server!
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Server rebuilt and started!
echo.

REM Wait for server to start
echo [INFO] Waiting for server to start...
timeout /t 10 /nobreak >nul

REM Check health
echo [INFO] Checking server health...
curl -s http://localhost:5000/api/health >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] Server is healthy!
    echo.
    echo Server is running at: http://localhost:5000
) else (
    echo [WARNING] Server may not be ready yet
    echo Check logs: docker-compose logs -f server
)

echo.
echo ========================================
echo   Rebuild Complete!
echo ========================================
echo.
echo Press any key to view logs (Ctrl+C to exit)...
pause >nul

REM Show logs
docker-compose logs -f server
