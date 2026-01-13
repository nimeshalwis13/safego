Write-Host "Starting SafeGo Application..." -ForegroundColor Green
Write-Host ""

# Function to start a process in a new PowerShell window
function Start-ServiceInNewWindow {
    param(
        [string]$Title,
        [string]$Directory,
        [string]$Command
    )
    
    Write-Host "Starting $Title..." -ForegroundColor Yellow
    $fullPath = Join-Path $PSScriptRoot $Directory
    Start-Process powershell -ArgumentList "-noexit", "-Command", "cd '$fullPath'; $Command"
}

# Start Backend
Start-ServiceInNewWindow -Title "Backend Server" -Directory "backend" -Command "npm start"

# Wait for backend to initialize
Write-Host "Waiting 5 seconds for backend to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Start Frontend
Start-ServiceInNewWindow -Title "Frontend (Student Interface)" -Directory "frontend" -Command "npm run dev"

# Start Admin Dashboard
Start-ServiceInNewWindow -Title "Admin Dashboard" -Directory "admin-dashboard" -Command "npm run dev"

Write-Host ""
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host "Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "Student Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Admin Dashboard: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")