# Fix About Page Red Bar - Remove Conflicting CSS
# Run this from ANHAD-FINAL directory

Write-Host "Fixing About Page Header..." -ForegroundColor Cyan

$aboutFile = "frontend\about\index.html"

# Read the file
$content = Get-Content $aboutFile -Raw

# Remove problematic CSS links but keep theme-variables and legal-shared
$content = $content -replace '<link rel="stylesheet" href="\.\./css/trendora-premium\.css">',''
$content = $content -replace '<link rel="stylesheet" href="\.\./css/anhad-core\.css">',''
$content = $content -replace '<link rel="stylesheet" href="\.\./css/claymorphism-system\.css">',''
$content = $content -replace '<link rel="stylesheet" href="\./about-premium\.css">',''

# Save the file
$content | Set-Content $aboutFile -NoNewline

Write-Host "✅ Removed conflicting CSS from about page" -ForegroundColor Green

# Copy to Android
Copy-Item $aboutFile "android\app\src\main\assets\public\about\index.html" -Force
Write-Host "✅ Deployed to Android" -ForegroundColor Green

# Copy to iOS  
Copy-Item $aboutFile "ios\App\App\public\about\index.html" -Force
Write-Host "✅ Deployed to iOS" -ForegroundColor Green

Write-Host "`n🎉 Done! The red bar should be gone. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor Yellow
