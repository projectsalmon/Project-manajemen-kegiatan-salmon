@echo off
setlocal
echo ===================================================
echo Memulai Aplikasi Kegiatan Kelurahan (React Native)
echo ===================================================

:: Menambahkan path Node.js ke sesi terminal ini
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"

:: Masuk ke folder react-native-salmon
cd /d "%~dp0react-native-salmon"

echo.
echo Menjalankan Expo Server...
echo Buka aplikasi Expo Go di HP Anda dan scan QR Code yang muncul.
echo.

call npx expo start

pause
