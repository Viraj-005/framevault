# Reproduce the existing FrameVault vector geometry as PNG manifest icons.
# Run from Windows PowerShell. No additional packages are required.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$iconDirectory = Join-Path $projectRoot 'public/icons'
New-Item -ItemType Directory -Force -Path $iconDirectory | Out-Null
$master = New-Object System.Drawing.Bitmap 512, 512
$graphics = [System.Drawing.Graphics]::FromImage($master)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([System.Drawing.Color]::Transparent)
# Leave 16 pixels of transparent padding on each side at the 128px size.
$graphics.TranslateTransform(64, 64)
$graphics.ScaleTransform(3, 3)
$background = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#171310'))
$copper = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#D4934A'))
$outline = New-Object System.Drawing.Pen ($copper.Color), 5
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc(0, 0, 56, 56, 180, 90)
$path.AddArc(72, 0, 56, 56, 270, 90)
$path.AddArc(72, 72, 56, 56, 0, 90)
$path.AddArc(0, 72, 56, 56, 90, 90)
$path.CloseFigure()
$graphics.FillPath($background, $path)
$outer = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(64,16), [System.Drawing.PointF]::new(112,64), [System.Drawing.PointF]::new(64,112), [System.Drawing.PointF]::new(16,64))
$inner = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(64,39), [System.Drawing.PointF]::new(89,64), [System.Drawing.PointF]::new(64,89), [System.Drawing.PointF]::new(39,64))
$center = [System.Drawing.PointF[]]@([System.Drawing.PointF]::new(64,50), [System.Drawing.PointF]::new(78,64), [System.Drawing.PointF]::new(64,78), [System.Drawing.PointF]::new(50,64))
$graphics.DrawPolygon($outline, $outer)
$graphics.FillPolygon($copper, $inner)
$graphics.FillPolygon($background, $center)
foreach ($size in @(16, 32, 48, 128)) {
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $surface = [System.Drawing.Graphics]::FromImage($bitmap)
    $surface.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $surface.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $surface.DrawImage($master, 0, 0, $size, $size)
    $bitmap.Save((Join-Path $iconDirectory "framevault-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $surface.Dispose()
    $bitmap.Dispose()
}
$graphics.Dispose()
$master.Dispose()
$path.Dispose()
$outline.Dispose()
$background.Dispose()
$copper.Dispose()
Write-Output 'Generated FrameVault PNG icons at 16, 32, 48, and 128 pixels.'
