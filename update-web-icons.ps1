# PowerShell script to regenerate web icons using Sharp
$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Web Icons Regeneration from app-logo-384.png" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\frontend\assets"
$sourceLogo = Join-Path $sourceDir "app-logo-384.png"

Write-Host "Source Logo: $sourceLogo" -ForegroundColor Yellow

if (-not (Test-Path $sourceLogo)) {
    Write-Host "ERROR: Source logo not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Source logo verified!" -ForegroundColor Green
Write-Host ""

# Check if Sharp is installed
Write-Host "Checking for Sharp module..." -ForegroundColor Yellow
$sharpCheck = npm list sharp 2>&1 | Select-String "sharp@"

if (-not $sharpCheck) {
    Write-Host "Installing Sharp..." -ForegroundColor Yellow
    npm install sharp
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install Sharp!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Sharp is ready!" -ForegroundColor Green
Write-Host ""

# Run the Node.js script to regenerate icons
Write-Host "Regenerating all web icons..." -ForegroundColor Cyan
node regenerate-web-icons.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Icon regeneration failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "SUCCESS! All web icons regenerated!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Sync with Capacitor..." -ForegroundColor Yellow
Write-Host "Run: npx cap sync android" -ForegroundColor White
Write-Host "Run: npx cap sync ios" -ForegroundColor White
Write-Host ""
