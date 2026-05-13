# ANHAD App Logo Replacement Script
$sourceLogo = "anhad_icon_clay3d_1778009424671.png"

if (-not (Test-Path $sourceLogo)) {
    Write-Host "❌ Error: Source logo not found" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Starting logo replacement..." -ForegroundColor Yellow

# Frontend icons
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-72x72.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-96x96.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-128x128.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-144x144.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-152x152.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-180x180.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-192x192.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-256x256.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-384x384.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-512x512.png" -Force
Copy-Item -Path $sourceLogo -Destination "frontend\assets\icons\icon-1024x1024.png" -Force

# Android icons
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-72x72.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-96x96.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-128x128.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-144x144.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-152x152.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-180x180.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-192x192.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-256x256.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-384x384.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-512x512.png" -Force
Copy-Item -Path $sourceLogo -Destination "android\app\src\main\assets\public\assets\icons\icon-1024x1024.png" -Force

# iOS icons
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-72x72.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-96x96.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-128x128.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-144x144.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-152x152.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-180x180.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-192x192.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-256x256.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-384x384.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-512x512.png" -Force
Copy-Item -Path $sourceLogo -Destination "ios\App\App\public\assets\icons\icon-1024x1024.png" -Force

Write-Host "🎉 Logo replacement complete!" -ForegroundColor Green
