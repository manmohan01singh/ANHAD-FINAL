# Apply Background Image to All Nitnem Pages
# Adds the beautiful traditional Sikh background to all pages

$nitnemPages = @(
    "frontend\nitnem\anand-sahib.html",
    "frontend\nitnem\chaupai-sahib.html",
    "frontend\nitnem\jaap-sahib.html",
    "frontend\nitnem\rehras-sahib.html",
    "frontend\nitnem\sohila-sahib.html",
    "frontend\nitnem\tav-prasad-savaiye.html",
    "frontend\nitnem\index.html",
    "frontend\nitnem\my-pothi.html",
    "frontend\nitnem\category\dasam.html",
    "frontend\nitnem\category\favorites.html",
    "frontend\nitnem\category\nitnem.html",
    "frontend\nitnem\category\sarbloh.html",
    "frontend\nitnem\category\sggs.html"
)

Write-Host "🔄 Applying background to all nitnem pages..." -ForegroundColor Yellow

foreach ($page in $nitnemPages) {
    $filePath = $page
    
    if (-not (Test-Path $filePath)) {
        Write-Host "⚠️  File not found: $filePath" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "📝 Processing: $filePath" -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    
    # Add background HTML after <body> tag
    $backgroundHtml = "  <!-- Background Orbs -->
  <div class=`"bg-orbs`">
    <div class=`"orb orb-1`"></div>
    <div class=`"orb orb-2`"></div>
    <div class=`"orb orb-3`"></div>
  </div>

  <!-- Ik Onkar Background Image -->
  <div class=`"ikonkar-background`" id=`"ikonkarBackground`">
    <img src=`"../assets/icons/bg-nitnem.jpg`" 
         alt=`"Background`" />
  </div>"
    
    if ($content -match '<body>') {
        $content = $content -replace '<body>', "<body>`n$backgroundHtml"
    }
    
    # Add CSS link before </head> if not already present
    if ($content -notmatch 'background-image\.css') {
        $cssLink = '  <link rel="stylesheet" href="../css/background-image.css">'
        $content = $content -replace '</head>', "$cssLink`n</head>"
    }
    
    # Save the updated content
    Set-Content $filePath $content -Encoding UTF8
    Write-Host "✅ Updated: $filePath" -ForegroundColor Green
}

Write-Host "🎉 Background application complete" -ForegroundColor Green
