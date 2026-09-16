Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Ridho\.gemini\antigravity-ide\brain\61ba8138-1192-488a-a482-d8fe64bb18f5\modern_salmon_app_icon_1789546173778.jpg"
$baseDir = "c:\coding salmon\Project-manajemen-kegiatan-salmon\react-native-salmon"

$image = [System.Drawing.Image]::FromFile($src)

function Export-ResizedPng {
    param(
        [System.Drawing.Image]$sourceImage,
        [string]$targetPath,
        [int]$width,
        [int]$height
    )
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $destImage = New-Object System.Drawing.Bitmap($width, $height)
    $destImage.SetResolution($sourceImage.HorizontalResolution, $sourceImage.VerticalResolution)

    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $wrapMode = New-Object System.Drawing.Imaging.ImageAttributes
    $wrapMode.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $graphics.DrawImage($sourceImage, $destRect, 0, 0, $sourceImage.Width, $sourceImage.Height, [System.Drawing.GraphicsUnit]::Pixel, $wrapMode)

    $graphics.Dispose()
    $destImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImage.Dispose()
    Write-Host "Saved: $targetPath ($width x $height)"
}

Export-ResizedPng $image "$baseDir\assets\icon.png" 1024 1024
Export-ResizedPng $image "$baseDir\assets\adaptive-icon.png" 1024 1024

$densities = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($d in $densities.Keys) {
    $dim = $densities[$d]
    $dir = "$baseDir\android\app\src\main\res\$d"
    if (Test-Path $dir) {
        Export-ResizedPng $image "$dir\ic_launcher.png" $dim $dim
        Export-ResizedPng $image "$dir\ic_launcher_round.png" $dim $dim
    }
}

$image.Dispose()
Write-Host "All icons converted to true PNG format successfully!"
