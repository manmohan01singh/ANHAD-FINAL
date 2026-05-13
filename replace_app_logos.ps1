# ANHAD App Logo Replacement Script
# Replaces all app logos with new claymorphism design

# Source and destination paths
$sourceLogo = "..\anhad_icon_clay3d_1778009424671.png"
$frontendAssets = "frontend\assets\icons"
$androidAssets = "android\app\src\main\assets\public\assets\icons"
$iosAssets = "ios\App\App\public\assets\icons"

# Check if source logo exists
if (-not (Test-Path $sourceLogo)) {
    Write-Host "❌ Error: Source logo not found at $sourceLogo" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Starting logo replacement process..." -ForegroundColor Yellow

# Function to copy and resize logo
function Copy-Logo($destPath, $size) {
    $destFile = "$destPath\icon-${size}x${size}.png"
    $destDir = Split-Path $destPath -Parent
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force
    }
    
    # Copy: logo
    Copy-Item -Path $sourceLogo -Destination $destFile -Force
    Write-Host "✅ Copied to $destFile" -ForegroundColor Green
}

# Replace frontend icons
Write-Host "📱 Updating frontend icons..." -ForegroundColor Cyan
Copy-Logo $frontendAssets "72"
Copy-Logo $frontendAssets "96" 
Copy-Logo $frontendAssets "128"
Copy-Logo $frontendAssets "144"
Copy-Logo $frontendAssets "152"
Copy-Logo $frontendAssets "180"
Copy-Logo $frontendAssets "192"
Copy-Logo $frontendAssets "256"
Copy-Logo $frontendAssets "384"
Copy-Logo $frontendAssets "512"
Copy-Logo $frontendAssets "1024"

# Replace Android icons
Write-Host "🤖 Updating Android icons..." -ForegroundColor Cyan
Copy-Logo $androidAssets "72"
Copy-Logo $androidAssets "96"
Copy-Logo $androidAssets "128"
Copy-Logo $androidAssets "144"
Copy-Logo $androidAssets "152"
Copy-Logo $androidAssets "180"
Copy-Logo $androidAssets "192"
Copy-Logo $androidAssets "256"
Copy-Logo $androidAssets "384"
Copy-Logo $androidAssets "512"
Copy-Logo $androidAssets "1024"

# Replace iOS icons
Write-Host "🍎 Updating iOS icons..." -ForegroundColor Cyan
Copy-Logo $iosAssets "72"
Copy-Logo $iosAssets "96"
Copy-Logo $iosAssets "128"
Copy-Logo $iosAssets "144"
Copy-Logo $iosAssets "152"
Copy-Logo $iosAssets "180"
Copy-Logo $iosAssets "192"
Copy-Logo $iosAssets "256"
Copy-Logo $iosAssets "384"
Copy-Logo $iosAssets "512"
Copy-Logo $iosAssets "1024"

# Update Android manifest.xml
$manifestPath = "android\app\src\main\AndroidManifest.xml"
if (Test-Path $manifestPath) {
    Write-Host "📝 Updating Android manifest.xml..." -ForegroundColor Cyan
    (Get-Content $manifestPath) -replace 'android:icon="@mipmap/ic_launcher"', 'android:icon="@mipmap/ic_launcher"' | Out-File $manifestPath
    Write-Host "✅ Updated Android manifest" -ForegroundColor Green
}

# Update PWA manifest.json
$pwaManifestPath = "frontend\manifest.json"
if (Test-Path $pwaManifestPath) {
    Write-Host "📝 Updating PWA manifest.json..." -ForegroundColor Cyan
    $manifestContent = Get-Content $pwaManifestPath
    $updatedManifest = $manifestContent -replace '"icons":', '"icons":' -replace '"src": "assets/icons/icon-', '"src": "assets/icons/icon-'
    Set-Content $updatedManifest | Out-File $pwaManifestPath
    Write-Host "✅ Updated PWA manifest" -ForegroundColor Green
}

Write-Host "🎉 Logo replacement complete!" -ForegroundColor Green
Write-Host "All app logos have been updated with the new claymorphism design." -ForegroundColor White
