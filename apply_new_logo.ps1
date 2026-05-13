# ANHAD App Logo Application Script
# Applies icon-1024x1024.png to all app platforms

$sourceLogo = "frontend\assets\icon-1024x1024.png"
$projectRoot = "."

# Check if source logo exists
if (-not (Test-Path $sourceLogo)) {
    Write-Host "❌ Error: Source logo not found at $sourceLogo" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Starting logo application process..." -ForegroundColor Yellow

# Function to copy and resize logo for different dimensions
function Copy-Logo($destPath, $size) {
    $destFile = "$destPath\icon-${size}x${size}.png"
    $destDir = Split-Path $destFile -Parent
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force
    }
    
    # Copy logo (keeping original size for all)
    Copy-Item -Path $sourceLogo -Destination $destFile -Force
    Write-Host "✅ Copied to $destFile" -ForegroundColor Green
}

# Update frontend assets icons
Write-Host "📱 Updating frontend icons..." -ForegroundColor Cyan
$sizes = @("16", "32", "72", "96", "128", "144", "152", "180", "192", "256", "384", "512", "1024")
foreach ($size in $sizes) {
    Copy-Logo "$projectRoot\frontend\assets" $size
}

# Update Android assets
Write-Host "🤖 Updating Android assets..." -ForegroundColor Cyan
foreach ($size in $sizes) {
    Copy-Logo "$projectRoot\android\app\src\main\assets\public\assets" $size
}

# Update Android mipmap directories (native launcher icons)
Write-Host "🎯 Updating Android launcher icons..." -ForegroundColor Cyan
$androidSizes = @{
    "ldpi" = "36"
    "mdpi" = "48" 
    "hdpi" = "72"
    "xhdpi" = "96"
    "xxhdpi" = "144"
    "xxxhdpi" = "192"
}

foreach ($density in $androidSizes.Keys) {
    $size = $androidSizes[$density]
    $mipmapPath = "$projectRoot\android\app\src\main\res\mipmap-$density"
    
    # Update ic_launcher
    Copy-Item -Path $sourceLogo -Destination "$mipmapPath\ic_launcher.png" -Force
    Copy-Item -Path $sourceLogo -Destination "$mipmapPath\ic_launcher_round.png" -Force
    
    Write-Host "✅ Updated $density launcher icons" -ForegroundColor Green
}

# Update any other app logo references
Write-Host "🔄 Updating other logo references..." -ForegroundColor Cyan

# Update app-logo.png files
Copy-Item -Path $sourceLogo -Destination "$projectRoot\frontend\assets\app-logo.png" -Force
Copy-Item -Path $sourceLogo -Destination "$projectRoot\frontend\assets\pure-logo.png" -Force
Copy-Item -Path $sourceLogo -Destination "$projectRoot\frontend\assets\apple-touch-icon.png" -Force
Copy-Item -Path $sourceLogo -Destination "$projectRoot\frontend\assets\pwa-icon-192.png" -Force
Copy-Item -Path $sourceLogo -Destination "$projectRoot\frontend\assets\pwa-icon-512.png" -Force

# Update favicon files (smaller versions)
Copy-Item -Path $sourceLogo -Destination "$projectRoot\frontend\assets\favicon-16x16.png" -Force
Copy-Item -Path $sourceLogo -Destination "$projectRoot\frontend\assets\favicon-32x32.png" -Force

Write-Host "🎉 Logo application complete!" -ForegroundColor Green
Write-Host "All app logos have been updated with the new icon-1024x1024.png design." -ForegroundColor White
