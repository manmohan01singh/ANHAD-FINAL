Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputSources = Join-Path $projectRoot 'opus4-source-files.txt'
$outputGuide   = Join-Path $projectRoot 'opus4-assembly-guide.txt'

$includeExts = @('.js','.ts','.jsx','.tsx','.html','.htm','.css','.json','.env','.md','.txt','.bat','.sh','.ps1')
$excludeGlobs = @('*\node_modules\*','*\.git\*','*\wrap-ansi\*','*\logs\*','collect-for-opus4.ps1','*-lock.json','opus4-*')

Write-Host ''
Write-Host '===== ANHAD - Opus 4 Payload Assembler =====' -ForegroundColor Cyan
Write-Host  Project : $projectRoot -ForegroundColor Gray
Write-Host  Output : $outputSources -ForegroundColor Gray
Write-Host ''

$allFiles = Get-ChildItem -Path $projectRoot -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $ext = $_.Extension.ToLower()
    if ($includeExts -notcontains $ext) { return $false }
    if ($_.Length -gt 2097152) { Write-Host  SKIP large: $($_.Name) -ForegroundColor Yellow; return $false }
    if ($_.Length -eq 0)       { Write-Host  SKIP empty: $($_.Name) -ForegroundColor DarkGray; return $false }
    foreach ($g in $excludeGlobs) { if ($_.FullName -like $g -or $_.Name -like $g) { return $false } }
    return $true
} | Sort-Object FullName

Write-Host  Found $($allFiles.Count) files. -ForegroundColor Green
Write-Host '  Building output...' -ForegroundColor White

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# SECTION II - COMPLETE SOURCE CODE')
[void]$sb.AppendLine(# Project : ANHAD)
[void]$sb.AppendLine(# Collected: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
[void]$sb.AppendLine(# Files : $($allFiles.Count))
[void]$sb.AppendLine('')

$fileCount  = 0
$totalChars = 0
$errors     = @()

foreach ($f in $allFiles) {
    $rel = $f.FullName.Replace($projectRoot + '\', '').Replace('\', '/')
    try {
        $content = Get-Content -Path $f.FullName -Raw -Encoding UTF8 -ErrorAction Stop
        if ([string]::IsNullOrEmpty($content)) { $content = '(empty file)' }
        [void]$sb.AppendLine(--- FILE: $rel ---)
        [void]$sb.Append($content)
        if (-not $content.EndsWith(
)) { [void]$sb.AppendLine('') }
        [void]$sb.AppendLine('')
        $fileCount++
        $totalChars += $content.Length
        if ($fileCount % 25 -eq 0) { Write-Host  ... $fileCount files done -ForegroundColor DarkGreen }
    } catch {
        $errors += $rel
        [void]$sb.AppendLine(--- FILE: $rel ---)
        [void]$sb.AppendLine((READ ERROR: $($_.Exception.Message)))
        [void]$sb.AppendLine('')
    }
}

[System.IO.File]::WriteAllText($outputSources, $sb.ToString(), [System.Text.Encoding]::UTF8)

$sizeKB  = [math]::Round((Get-Item $outputSources).Length / 1KB, 1)
$sizeMB  = [math]::Round((Get-Item $outputSources).Length / 1MB, 2)
$tokEstK = [math]::Round($totalChars / 4000, 1)
$totalTK = [math]::Round(($totalChars / 4 + 23000) / 1000, 1)

Write-Host ''
Write-Host '===== Done =====' -ForegroundColor Green
Write-Host  Files : $fileCount -ForegroundColor Cyan
Write-Host  Size : $sizeKB KB = $sizeMB MB -ForegroundColor Cyan
Write-Host  Src tokens: ~$tokEstK K -ForegroundColor Cyan
Write-Host  + audit : ~20K + prompt: ~3K -ForegroundColor DarkGray
Write-Host  TOTAL est : ~$totalTK K / 1000K -ForegroundColor Yellow
if ($errors.Count -gt 0) { Write-Host  Errors : $($errors.Count) files could not be read -ForegroundColor Red }
Write-Host ''
Write-Host  See: $outputGuide -ForegroundColor Yellow

$lines = @(
    'ANHAD - Opus 4 Assembly Guide',
    '==============================',
    '',
    Generated : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),
    Source file: $outputSources,
    Size : $sizeMB MB (~$tokEstK K source tokens),
    TOTAL est : ~$totalTK K / 1000K,
    '',
    'ASSEMBLY STEPS',
    '--------------',
    'Step 1: Open claude.ai or your Opus 4 API client',
    'Step 2: Paste the Depth-Charge Prompt template from the Cascade chat',
    'Step 3: In [SECTION I - PRIOR AUDIT], paste the audit from Cascade chat',
    '        (from SECTION A through Architectural Redesign Proposal)',
    'Step 4: In [SECTION II - COMPLETE SOURCE CODE], paste opus4-source-files.txt',
    'Step 5: Send (use Extended Thinking mode if available)',
    '',
    'TIER ORDER (if hitting context limit, add tiers in order)',
    '---------------------------------------------------------',
    'Tier 0 - Security: backend/server.js, gurbani-gpt.js, .env, electron-main.js, sw.js, sw-alarm.js',
    'Tier 1 - Data    : lib/unified-storage.js, lib/global-alarm-system.js, NitnemTracker/nitnem-tracker.js',
    'Tier 2 - UX      : GurbaniRadio/gurbani-radio.js, js/trendora-app.js, js/spa-router.js, index.html',
    'Tier 3 - BaniDB  : lib/banidb.js, lib/gurbani-db.js, SehajPaath/services/banidb-api.js, reader.js',
    'Tier 4 - Logic   : Calendar/nanakshahi-calendar.js, NaamAbhyas/naam-abhyas.js, components/streak-engine.js',
    'Tier 5 - Rest    : All remaining JS files',
    'Tier 6 - CSS/HTML: All CSS and HTML files',
    '',
    'ERRORS',
    '------'
)
foreach ($err in $errors) { $lines +=  $err }
if ($errors.Count -eq 0) { $lines += '  (none)' }
[System.IO.File]::WriteAllLines($outputGuide, $lines, [System.Text.Encoding]::UTF8)

Write-Host  Guide saved. -ForegroundColor Green
