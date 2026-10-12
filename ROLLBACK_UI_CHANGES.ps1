# ROLLBACK SCRIPT - Reverts all UI reconstruction changes
# Run this if the new compact settings causes issues

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ANHAD NITNEM READER - ROLLBACK UI CHANGES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$workspace = "c:\Users\Manmohan Singh\converttoApp\ANHAD-FINAL"
Set-Location $workspace

Write-Host "[1/5] Removing new CSS files..." -ForegroundColor Yellow
Remove-Item "frontend\nitnem\css\compact-settings.css" -ErrorAction SilentlyContinue
Remove-Item "frontend\nitnem\css\z-index-scale.css" -ErrorAction SilentlyContinue
Write-Host "      ✓ Removed compact-settings.css" -ForegroundColor Green
Write-Host "      ✓ Removed z-index-scale.css" -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Removing new JavaScript controller..." -ForegroundColor Yellow
Remove-Item "frontend\nitnem\js\compact-settings-controller.js" -ErrorAction SilentlyContinue
Write-Host "      ✓ Removed compact-settings-controller.js" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Restoring reader.html..." -ForegroundColor Yellow
# Remove compact settings HTML and stylesheet links
$readerHtml = Get-Content "frontend\nitnem\reader.html" -Raw
$readerHtml = $readerHtml -replace '<link rel="stylesheet" href="css/z-index-scale.css">\r?\n\s*', ''
$readerHtml = $readerHtml -replace '<link rel="stylesheet" href="css/compact-settings.css">\r?\n\s*', ''
$readerHtml = $readerHtml -replace '<script src="js/compact-settings-controller.js"></script>\r?\n\s*', ''
$readerHtml = $readerHtml -replace '<!-- Compact Settings Sheet.*?</div>\r?\n\s*\r?\n', '', 'Singleline'
$readerHtml | Set-Content "frontend\nitnem\reader.html" -NoNewline
Write-Host "      ✓ Removed compact settings HTML" -ForegroundColor Green
Write-Host "      ✓ Removed stylesheet links" -ForegroundColor Green
Write-Host "      ✓ Removed script tag" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Restoring reader-engine.js..." -ForegroundColor Yellow
# Restore openSettings function
$readerEngine = Get-Content "frontend\nitnem\js\reader-engine.js" -Raw

# Remove window.readerEngine export
$readerEngine = $readerEngine -replace '\s*// Expose API for compact settings controller[\s\S]*?window\.readerEngine = \{[^}]+\};\r?\n', ''

# Restore original openSettings function
$readerEngine = $readerEngine -replace 'function openSettings\(\) \{[^}]*if \(window\.compactSettingsController[^}]+\}[^}]+\}', @'
function openSettings() {
        state.isSettingsOpen = true;
        els.settingsOverlay?.classList.add('visible');
        els.settingsDrawer?.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
'@

$readerEngine | Set-Content "frontend\nitnem\js\reader-engine.js" -NoNewline
Write-Host "      ✓ Restored original openSettings()" -ForegroundColor Green
Write-Host "      ✓ Removed window.readerEngine export" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Cleanup..." -ForegroundColor Yellow
Remove-Item ".agents\tasks\nitnem-reader-ui-reconstruction" -Recurse -ErrorAction SilentlyContinue
Write-Host "      ✓ Removed implementation task files" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✓ ROLLBACK COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "The reader has been restored to its original state." -ForegroundColor White
Write-Host "Refresh your browser to see the original UI." -ForegroundColor White
Write-Host ""
