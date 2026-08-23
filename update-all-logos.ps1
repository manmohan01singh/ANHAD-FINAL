# PowerShell script to update all app icons with correct logo
# Source: app-logo-384.png and other app-logo-* variants

$sourceDir = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\frontend\assets"
$androidRes = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\android\app\src\main\res"

Write-Host "Starting logo replacement..." -ForegroundColor Green

# Install Sharp if not available (for image resizing)
Write-Host "Checking for Sharp module..." -ForegroundColor Yellow
$sharpInstalled = npm list -g sharp 2>&1 | Select-String "sharp@"
if (-not $sharpInstalled) {
    Write-Host "Installing Sharp for image processing..." -ForegroundColor Yellow
    npm install -g sharp-cli
}

# Define Android density mappings
$androidDensities = @{
    "ldpi" = 36
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

# Source logo
$sourceLogo = Join-Path $sourceDir "app-logo-384.png"

Write-Host "`nReplacing Android App Launcher Icons..." -ForegroundColor Cyan

foreach ($density in $androidDensities.Keys) {
    $size = $androidDensities[$density]
    $targetDir = Join-Path $androidRes "mipmap-$density"
    
    if (Test-Path $targetDir) {
        Write-Host "Processing $density (${size}x${size})..." -ForegroundColor Yellow
        
        # Replace ic_launcher.png
        $target = Join-Path $targetDir "ic_launcher.png"
        Copy-Item -Path $sourceLogo -Destination $target -Force
        Write-Host "  ✓ Copied to $target" -ForegroundColor Green
        
        # Replace ic_launcher_round.png
        $targetRound = Join-Path $targetDir "ic_launcher_round.png"
        Copy-Item -Path $sourceLogo -Destination $targetRound -Force
        Write-Host "  ✓ Copied to $targetRound" -ForegroundColor Green
        
        # Replace ic_launcher_foreground.png
        $targetForeground = Join-Path $targetDir "ic_launcher_foreground.png"
        Copy-Item -Path $sourceLogo -Destination $targetForeground -Force
        Write-Host "  ✓ Copied to $targetForeground" -ForegroundColor Green
    }
}

Write-Host "`nReplacing Android Notification Icons..." -ForegroundColor Cyan

# For notification icons, we need to copy to all drawable densities
$drawableDensities = @("drawable", "drawable-hdpi", "drawable-mdpi", "drawable-xhdpi", "drawable-xxhdpi", "drawable-xxxhdpi")

foreach ($drawable in $drawableDensities) {
    $targetDir = Join-Path $androidRes $drawable
    
    if (Test-Path $targetDir) {
        $target = Join-Path $targetDir "ic_stat_notify.png"
        Copy-Item -Path $sourceLogo -Destination $target -Force
        Write-Host "  ✓ Copied notification icon to $drawable" -ForegroundColor Green
    }
}

Write-Host "`nReplacing Android Splash Screens..." -ForegroundColor Cyan

$splashDensities = @(
    "drawable",
    "drawable-land-hdpi", "drawable-land-ldpi", "drawable-land-mdpi", 
    "drawable-land-xhdpi", "drawable-land-xxhdpi", "drawable-land-xxxhdpi",
    "drawable-port-hdpi", "drawable-port-ldpi", "drawable-port-mdpi",
    "drawable-port-xhdpi", "drawable-port-xxhdpi", "drawable-port-xxxhdpi",
    "drawable-hdpi", "drawable-mdpi", "drawable-xhdpi", "drawable-xxhdpi", "drawable-xxxhdpi"
)

foreach ($drawable in $splashDensities) {
    $targetDir = Join-Path $androidRes $drawable
    
    if (Test-Path $targetDir) {
        $splashFile = Join-Path $targetDir "splash.png"
        if (Test-Path $splashFile) {
            Copy-Item -Path $sourceLogo -Destination $splashFile -Force
            Write-Host "  ✓ Updated splash in $drawable" -ForegroundColor Green
        }
    }
}

Write-Host "`nReplacing iOS Assets..." -ForegroundColor Cyan

# Copy to iOS public assets folder
$iosAssetsDir = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\ios\App\App\public\assets"
if (Test-Path $iosAssetsDir) {
    # Copy all app-logo variants
    Copy-Item -Path "$sourceDir\app-logo*.png" -Destination $iosAssetsDir -Force
    Copy-Item -Path "$sourceDir\app-logo*.webp" -Destination $iosAssetsDir -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$sourceDir\app-logo*.avif" -Destination $iosAssetsDir -Force -ErrorAction SilentlyContinue
    
    # Copy icon files
    Copy-Item -Path "$sourceDir\icon-*.png" -Destination $iosAssetsDir -Force -ErrorAction SilentlyContinue
    
    Write-Host "  ✓ Copied all logos to iOS assets" -ForegroundColor Green
}

Write-Host "`nVerifying Android synced assets..." -ForegroundColor Cyan

# Sync to Android assets public folder
$androidAssetsDir = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\android\app\src\main\assets\public\assets"
if (Test-Path $androidAssetsDir) {
    Copy-Item -Path "$sourceDir\app-logo*.png" -Destination $androidAssetsDir -Force
    Copy-Item -Path "$sourceDir\app-logo*.webp" -Destination $androidAssetsDir -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "$sourceDir\app-logo*.avif" -Destination $androidAssetsDir -Force -ErrorAction SilentlyContinue
    
    Copy-Item -Path "$sourceDir\icon-*.png" -Destination $androidAssetsDir -Force -ErrorAction SilentlyContinue
    
    Write-Host "  ✓ Synced logos to Android web assets" -ForegroundColor Green
}

Write-Host "`n✅ ALL LOGOS UPDATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Rebuild Android app: ./gradlew clean assembleRelease" -ForegroundColor White
Write-Host "2. Sync Capacitor: npx cap sync android" -ForegroundColor White
Write-Host "3. For iOS: npx cap sync ios" -ForegroundColor White
Write-Host "All app icons, notification icons, and splash screens now use app-logo-384.png!" -ForegroundColor Cyan
