@echo off
echo Starting SafeGo Application...
echo.

echo Starting Backend Server on port 5000...
cd /d "%~dp0backend"
start "SafeGo Backend" cmd /k "npm start"

echo.
echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend on port 3000...
cd /d "%~dp0frontend"
start "SafeGo Frontend" cmd /k "npm run dev"

echo.
echo Starting Admin Dashboard on port 3001...
cd /d "%~dp0admin-dashboard"
start "SafeGo Admin Dashboard" cmd /k "npm run dev"

echo.
echo All services are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Admin Dashboard: http://localhost:3001
echo.
echo Press any key to close this window...
pause > nul