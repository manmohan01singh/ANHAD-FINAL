# Simple PowerShell script to update all app icons
$sourceDir = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\frontend\assets"
$androidRes = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\android\app\src\main\res"
$sourceLogo = Join-Path $sourceDir "app-logo-384.png"

Write-Host "Starting logo replacement..." -ForegroundColor Green
Write-Host "Source: $sourceLogo" -ForegroundColor Yellow

# Android mipmap densities
$mipmapDirs = @("mipmap-ldpi", "mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")

Write-Host "`nUpdating Android App Icons..." -ForegroundColor Cyan
foreach ($dir in $mipmapDirs) {
    $targetDir = Join-Path $androidRes $dir
    if (Test-Path $targetDir) {
        Copy-Item -Path $sourceLogo -Destination (Join-Path $targetDir "ic_launcher.png") -Force
        Copy-Item -Path $sourceLogo -Destination (Join-Path $targetDir "ic_launcher_round.png") -Force
        Copy-Item -Path $sourceLogo -Destination (Join-Path $targetDir "ic_launcher_foreground.png") -Force
        Write-Host "  Updated $dir" -ForegroundColor Green
    }
}

# Android notification icons
$drawableDirs = @("drawable", "drawable-hdpi", "drawable-mdpi", "drawable-xhdpi", "drawable-xxhdpi", "drawable-xxxhdpi")

Write-Host "`nUpdating Android Notification Icons..." -ForegroundColor Cyan
foreach ($dir in $drawableDirs) {
    $targetDir = Join-Path $androidRes $dir
    if (Test-Path $targetDir) {
        Copy-Item -Path $sourceLogo -Destination (Join-Path $targetDir "ic_stat_notify.png") -Force
        Write-Host "  Updated $dir" -ForegroundColor Green
    }
}

# Android splash screens
Write-Host "`nUpdating Android Splash Screens..." -ForegroundColor Cyan
$splashDirs = @("drawable-hdpi", "drawable-mdpi", "drawable-xhdpi", "drawable-xxhdpi", "drawable-xxxhdpi")
foreach ($dir in $splashDirs) {
    $targetDir = Join-Path $androidRes $dir
    $splashFile = Join-Path $targetDir "splash.png"
    if (Test-Path $splashFile) {
        Copy-Item -Path $sourceLogo -Destination $splashFile -Force
        Write-Host "  Updated splash in $dir" -ForegroundColor Green
    }
}

# Main drawable splash
$mainSplash = Join-Path $androidRes "drawable\splash.png"
if (Test-Path $mainSplash) {
    Copy-Item -Path $sourceLogo -Destination $mainSplash -Force
    Write-Host "  Updated main splash" -ForegroundColor Green
}

# iOS assets
Write-Host "`nUpdating iOS Assets..." -ForegroundColor Cyan
$iosAssetsDir = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\ios\App\App\public\assets"
if (Test-Path $iosAssetsDir) {
    Get-ChildItem -Path $sourceDir -Filter "app-logo*.png" | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $iosAssetsDir -Force
    }
    Get-ChildItem -Path $sourceDir -Filter "icon-*.png" | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $iosAssetsDir -Force
    }
    Write-Host "  iOS assets updated" -ForegroundColor Green
}

# Android web assets
Write-Host "`nUpdating Android Web Assets..." -ForegroundColor Cyan
$androidAssetsDir = "C:\Users\Manmohan Singh\OneDrive\Desktop\APP\ANHAD-FINAL\android\app\src\main\assets\public\assets"
if (Test-Path $androidAssetsDir) {
    Get-ChildItem -Path $sourceDir -Filter "app-logo*.png" | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $androidAssetsDir -Force
    }
    Get-ChildItem -Path $sourceDir -Filter "icon-*.png" | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $androidAssetsDir -Force
    }
    Write-Host "  Android web assets updated" -ForegroundColor Green
}

Write-Host "`nALL LOGOS UPDATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "Next: Run 'npx cap sync android' and 'npx cap sync ios'" -ForegroundColor Yellow
