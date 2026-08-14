@echo off
setlocal
echo ===================================================
echo   Build File APK Android (Kegiatan Kelurahan)
echo ===================================================
echo.
echo Menyiapkan proses build APK standalone...
echo.

:: Menambahkan path Node.js ke sesi terminal ini
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"

cd /d "%~dp0react-native-salmon"

echo 1. Pastikan Anda sudah login ke akun Expo (gratis di https://expo.dev).
echo 2. Jika belum login, perintah di bawah akan meminta Anda login/daftar terlebih dahulu.
echo.
echo Memulai EAS Build untuk Android (APK)...
echo.

call npx eas-cli build -p android --profile preview

echo.
pause
