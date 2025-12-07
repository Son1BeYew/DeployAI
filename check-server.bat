@echo off
REM Quick check script for AIStudio Server status

echo.
echo ========================================
echo   AIStudio Server Status Check
echo ========================================
echo.

REM Check Docker
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Docker Desktop: NOT RUNNING
    echo.
    echo Please start Docker Desktop first.
    pause
    exit /b 1
) else (
    echo [OK] Docker Desktop: RUNNING
)

echo.

REM Check containers
echo [INFO] Container Status:
docker-compose ps

echo.

REM Check health endpoint
echo [INFO] Health Check:
curl -s http://localhost:5000/api/health

echo.
echo.

REM Check callback endpoint
echo [INFO] Callback Endpoint:
curl -s http://localhost:5000/api/topup/callback

echo.
echo.

REM Show recent logs
echo [INFO] Recent Logs (last 20 lines):
echo ----------------------------------------
docker-compose logs --tail=20 server

echo.
echo ========================================
echo   Status Check Complete!
echo ========================================
echo.

pause
