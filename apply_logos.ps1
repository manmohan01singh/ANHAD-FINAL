$src = "C:\right\ANHAD\new_logos_preview"

# Base
Copy-Item "$src\icon-128.png" "C:\right\ANHAD\frontend\assets\app-logo-128.png" -Force
Copy-Item "$src\icon-144.png" "C:\right\ANHAD\frontend\assets\app-logo-144.png" -Force
Copy-Item "$src\icon-384.png" "C:\right\ANHAD\frontend\assets\app-logo-384.png" -Force
Copy-Item "$src\icon-96.png" "C:\right\ANHAD\frontend\assets\app-logo-96.png" -Force
Copy-Item "$src\icon-512.png" "C:\right\ANHAD\frontend\assets\app-logo.png" -Force
Copy-Item "$src\icon-180.png" "C:\right\ANHAD\frontend\assets\apple-touch-icon.png" -Force
Copy-Item "$src\icon-16.png" "C:\right\ANHAD\frontend\assets\favicon-16x16.png" -Force
Copy-Item "$src\icon-32.png" "C:\right\ANHAD\frontend\assets\favicon-32x32.png" -Force
Copy-Item "$src\icon-512.png" "C:\right\ANHAD\frontend\assets\pure-logo.png" -Force
Copy-Item "$src\icon-192.png" "C:\right\ANHAD\frontend\assets\pwa-icon-192.png" -Force
Copy-Item "$src\icon-512.png" "C:\right\ANHAD\frontend\assets\pwa-icon-512.png" -Force

# Assets/icons
Copy-Item "$src\icon-72.png" "C:\right\ANHAD\frontend\assets\icons\icon-72x72.png" -Force
Copy-Item "$src\icon-152.png" "C:\right\ANHAD\frontend\assets\icons\icon-152x152.png" -Force
Copy-Item "$src\icon-192.png" "C:\right\ANHAD\frontend\assets\icons\icon-192x192.png" -Force
Copy-Item "$src\icon-512.png" "C:\right\ANHAD\frontend\assets\icons\icon-512x512.png" -Force
Copy-Item "C:\right\ANHAD\anhad_logo_ultimate_cropped_transparent.png" "C:\right\ANHAD\frontend\assets\icons\icon-1024x1024.png" -Force

# Nitnem
Copy-Item "$src\icon-72.png" "C:\right\ANHAD\frontend\nitnem\icons\icon-72.png" -Force
Copy-Item "$src\icon-96.png" "C:\right\ANHAD\frontend\nitnem\icons\icon-96.png" -Force
Copy-Item "$src\icon-128.png" "C:\right\ANHAD\frontend\nitnem\icons\icon-128.png" -Force
Copy-Item "$src\icon-144.png" "C:\right\ANHAD\frontend\nitnem\icons\icon-144.png" -Force
Copy-Item "$src\icon-152.png" "C:\right\ANHAD\frontend\nitnem\icons\icon-152.png" -Force
Copy-Item "$src\icon-192.png" "C:\right\ANHAD\frontend\nitnem\icons\icon-192.png" -Force
Copy-Item "$src\icon-384.png" "C:\right\ANHAD\frontend\nitnem\icons\icon-384.png" -Force
Copy-Item "$src\icon-512.png" "C:\right\ANHAD\frontend\nitnem\icons\icon-512.png" -Force

# root favicon .ico (using powershell to build .ico)
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$src\icon-32.png")
$icoStream = New-Object System.IO.MemoryStream
$binaryWriter = New-Object System.IO.BinaryWriter($icoStream)
$binaryWriter.Write([uint16]0)
$binaryWriter.Write([uint16]1)
$binaryWriter.Write([uint16]1)
$binaryWriter.Write([byte]32)
$binaryWriter.Write([byte]32)
$binaryWriter.Write([byte]0)
$binaryWriter.Write([byte]0)
$binaryWriter.Write([uint16]1)
$binaryWriter.Write([uint16]32)

$ms = New-Object System.IO.MemoryStream
$img.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()

$binaryWriter.Write([uint32]$pngBytes.Length)
$binaryWriter.Write([uint32]22)
$binaryWriter.Write($pngBytes)
$binaryWriter.Flush()

$icoBytes = $icoStream.ToArray()
[System.IO.File]::WriteAllBytes("C:\right\ANHAD\frontend\favicon.ico", $icoBytes)
$img.Dispose()
$icoStream.Dispose()
$binaryWriter.Dispose()
$ms.Dispose()

# Resources
if (Test-Path "C:\right\ANHAD\resources\icon.png") {
    Copy-Item "C:\right\ANHAD\anhad_logo_ultimate_cropped_transparent.png" "C:\right\ANHAD\resources\icon.png" -Force
}

Write-Host "Icons Applied Successfully."
