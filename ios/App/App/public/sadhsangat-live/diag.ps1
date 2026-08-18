$content = [System.IO.File]::ReadAllText('index.html', [System.Text.Encoding]::UTF8)
$idx = $content.IndexOf('yt-live-now-thumb-wrap')
"yt-live-now-thumb-wrap at: $idx"
if ($idx -gt 0) {
    $snippet = $content.Substring([Math]::Max(0,$idx-50), 350)
    Write-Host $snippet
}
