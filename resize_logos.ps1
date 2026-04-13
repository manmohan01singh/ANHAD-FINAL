param (
    [string]$SourceImage,
    [string]$OutputDir
)

Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512)

if (-not (Test-Path -Path $OutputDir)) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
}

$img = [System.Drawing.Image]::FromFile($SourceImage)

foreach ($size in $sizes) {
    $destImg = New-Object System.Drawing.Bitmap($size, $size)
    $destImg.SetResolution($img.HorizontalResolution, $img.VerticalResolution)
    
    $graphics = [System.Drawing.Graphics]::FromImage($destImg)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    
    $wrapMode = New-Object System.Drawing.Imaging.ImageAttributes
    $wrapMode.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    
    $graphics.DrawImage($img, $rect, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $wrapMode)
    
    $destPath = Join-Path -Path $OutputDir -ChildPath "icon-$size.png"
    $destImg.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $destImg.Dispose()
    Write-Host "Generated icon-$size.png"
}

$img.Dispose()
Write-Host "All icons generated successfully."
