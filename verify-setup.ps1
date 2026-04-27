#!/usr/bin/env powershell

# BusTrack Backend Startup Verification Script
# Run with: .\verify-setup.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BusTrack Backend Setup Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "1. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check if backend directory exists
Write-Host "`n2. Checking backend directory..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "   ✅ Backend directory found" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend directory not found" -ForegroundColor Red
    exit 1
}

# Check if .env exists
Write-Host "`n3. Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
    $mongoUrl = Select-String -Path "backend\.env" -Pattern "MONGO"
    if ($mongoUrl) {
        Write-Host "   ✅ MongoDB URL configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  MongoDB URL not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env file not found. Please create it from .env.example" -ForegroundColor Red
}

# Check if dependencies are installed
Write-Host "`n4. Checking npm dependencies..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "   ✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules not found. Run: npm install (in backend directory)" -ForegroundColor Yellow
}

# Check server.js
Write-Host "`n5. Checking server.js..." -ForegroundColor Yellow
if (Test-Path "backend\server.js") {
    Write-Host "   ✅ server.js exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ server.js not found" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Navigate to backend folder:"
Write-Host "   cd backend`n" -ForegroundColor Cyan

Write-Host "2. Install dependencies (if not done):"
Write-Host "   npm install`n" -ForegroundColor Cyan

Write-Host "3. Start the server:"
Write-Host "   npm start`n" -ForegroundColor Cyan

Write-Host "4. You should see:"
Write-Host "   ✅ MongoDB Connected Successfully" -ForegroundColor Green
Write-Host "   🚀 Server running on port 5000`n" -ForegroundColor Green

Write-Host "5. In another terminal, start frontend:"
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm start`n" -ForegroundColor Cyan

Write-Host "========================================`n" -ForegroundColor Cyan
