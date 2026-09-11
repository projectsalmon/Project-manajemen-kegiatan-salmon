@echo off
setlocal
echo ===================================================
echo   Push Pembaruan ke GitHub (Project Salmon)
echo ===================================================
echo.
echo Mengirim commit terbaru ke remote origin/main...
echo Jika jendela login browser muncul, silakan klik 'Sign in with your browser'.
echo.

git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo    PUSH BERHASIL KE GITHUB!
    echo ===================================================
) else (
    echo.
    echo [INFO] Jika membutuhkan autentikasi, silakan login melalui popup browser.
)

echo.
pause
