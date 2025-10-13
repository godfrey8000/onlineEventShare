# Windows PowerShell setup script
# Run this script to setup the project on Windows

Write-Host "🎮 TosmTracker Setup for Windows" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host " ✓ Found $nodeVersion" -ForegroundColor Green
} else {
    Write-Host " ✗ Not found" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Docker (optional)
Write-Host "Checking Docker..." -NoNewline
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host " ✓ Found" -ForegroundColor Green
    $useDocker = Read-Host "Do you want to use Docker? (y/n)"
} else {
    Write-Host " ⚠ Not found (optional)" -ForegroundColor Yellow
    $useDocker = "n"
}

# Setup environment files
Write-Host ""
Write-Host "Setting up environment files..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env" -ForegroundColor Green
} else {
    Write-Host "⚠ .env already exists" -ForegroundColor Yellow
}

if (-not (Test-Path "tracker-frontend\.env")) {
    Copy-Item "tracker-frontend\.env.example" "tracker-frontend\.env"
    Write-Host "✓ Created tracker-frontend\.env" -ForegroundColor Green
} else {
    Write-Host "⚠ tracker-frontend\.env already exists" -ForegroundColor Yellow
}

# Generate JWT secret
Write-Host ""
Write-Host "Generating JWT secret..." -ForegroundColor Cyan
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "Generated secret (add to .env):" -ForegroundColor Yellow
Write-Host "JWT_SECRET=`"$secret`"" -ForegroundColor Green
Write-Host ""

if ($useDocker -eq "y") {
    # Docker setup
    Write-Host "Starting with Docker..." -ForegroundColor Cyan
    Write-Host "Please update .env with your settings, then run:" -ForegroundColor Yellow
    Write-Host "  docker-compose up --build" -ForegroundColor Green
} else {
    # Manual setup
    Write-Host "Installing dependencies..." -ForegroundColor Cyan

    Write-Host "Installing backend dependencies..." -NoNewline
    npm install --silent
    Write-Host " ✓" -ForegroundColor Green

    Write-Host "Installing frontend dependencies..." -NoNewline
    Set-Location tracker-frontend
    npm install --silent
    Set-Location ..
    Write-Host " ✓" -ForegroundColor Green

    Write-Host ""
    Write-Host "Setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update .env with your database settings" -ForegroundColor Yellow
    Write-Host "2. Run database migrations: npx prisma migrate dev" -ForegroundColor Yellow
    Write-Host "3. Start backend: npm run dev" -ForegroundColor Yellow
    Write-Host "4. Start frontend: cd tracker-frontend && npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "For more information, see README.md and DEPLOYMENT.md" -ForegroundColor Cyan
