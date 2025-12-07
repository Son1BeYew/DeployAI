@echo off
REM Test MoMo callback endpoint accessibility

echo.
echo ========================================
echo   Test MoMo Callback Endpoint
echo ========================================
echo.

REM Test local callback
echo [INFO] Testing local callback endpoint...
curl -s http://localhost:5000/api/topup/callback
echo.
echo.

REM Test production callback
echo [INFO] Testing production callback endpoint...
curl -s https://enternapic.io.vn/api/topup/callback
echo.
echo.

REM Test with sample callback data
echo [INFO] Testing callback with sample data...
curl -X POST http://localhost:5000/api/topup/callback ^
  -H "Content-Type: application/json" ^
  -d "{\"orderId\":\"topup-test123\",\"resultCode\":0,\"message\":\"Success\"}"
echo.
echo.

echo ========================================
echo   Test Complete!
echo ========================================
echo.
echo If you see errors above, the callback endpoint may not be accessible.
echo.
pause
